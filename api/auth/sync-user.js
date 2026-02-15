import { getSql, ensureFirebaseBridgeTables } from '../_lib/neon.js';
import { handleOptions, methodNotAllowed, sendJson } from '../_lib/http.js';
import { requireFirebaseUser } from '../_lib/require-user.js';

function sanitizeUsername(email, uid) {
  if (email && email.includes('@')) {
    return email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 28) || `fb_${uid.slice(0, 12)}`;
  }
  return `fb_${uid.slice(0, 20)}`;
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  const methodError = methodNotAllowed(req, res, ['POST']);
  if (methodError) return methodError;

  const firebaseUser = await requireFirebaseUser(req, res);
  if (!firebaseUser) return;

  try {
    const sql = getSql();
    await ensureFirebaseBridgeTables();

    const existingLink = await sql`
      SELECT l.user_id, u.username, u.email, u.display_name, u.role
      FROM firebase_user_links l
      JOIN users u ON u.id = l.user_id
      WHERE l.firebase_uid = ${firebaseUser.uid}
      LIMIT 1
    `;

    let userRow;

    if (existingLink.length > 0) {
      const linkedUserId = existingLink[0].user_id;

      const updated = await sql`
        UPDATE users
        SET
          email = COALESCE(${firebaseUser.email}, email),
          display_name = COALESCE(${firebaseUser.name}, display_name),
          updated_at = now()
        WHERE id = ${linkedUserId}
        RETURNING id, username, email, display_name, role, created_at, updated_at
      `;

      await sql`
        UPDATE firebase_user_links
        SET
          email = ${firebaseUser.email},
          display_name = ${firebaseUser.name},
          updated_at = now()
        WHERE user_id = ${linkedUserId}
      `;

      userRow = updated[0] || existingLink[0];
    } else {
      let candidate = [];

      if (firebaseUser.email) {
        candidate = await sql`
          SELECT id, username, email, display_name, role, created_at, updated_at
          FROM users
          WHERE email = ${firebaseUser.email}
          ORDER BY id ASC
          LIMIT 1
        `;
      }

      if (candidate.length === 0) {
        const baseUsername = sanitizeUsername(firebaseUser.email, firebaseUser.uid);
        const provisionalPassword = `firebase_${firebaseUser.uid}`;

        const inserted = await sql`
          INSERT INTO users (username, email, password, display_name, role, created_at, updated_at)
          VALUES (${baseUsername}, ${firebaseUser.email}, ${provisionalPassword}, ${firebaseUser.name}, 'student', now(), now())
          ON CONFLICT (username)
          DO UPDATE SET
            email = COALESCE(EXCLUDED.email, users.email),
            display_name = COALESCE(EXCLUDED.display_name, users.display_name),
            updated_at = now()
          RETURNING id, username, email, display_name, role, created_at, updated_at
        `;

        candidate = inserted;
      }

      const selected = candidate[0];

      await sql`
        INSERT INTO firebase_user_links (user_id, firebase_uid, email, display_name, created_at, updated_at)
        VALUES (${selected.id}, ${firebaseUser.uid}, ${firebaseUser.email}, ${firebaseUser.name}, now(), now())
        ON CONFLICT (firebase_uid)
        DO UPDATE SET
          user_id = EXCLUDED.user_id,
          email = EXCLUDED.email,
          display_name = EXCLUDED.display_name,
          updated_at = now()
      `;

      userRow = selected;
    }

    return sendJson(res, 200, {
      success: true,
      message: 'User synchronized',
      user: {
        id: userRow.id,
        firebaseUid: firebaseUser.uid,
        username: userRow.username,
        email: userRow.email,
        displayName: userRow.display_name,
        role: userRow.role,
      },
    });
  } catch (error) {
    console.error('sync-user error:', error);
    return sendJson(res, 500, {
      success: false,
      message: 'Failed to synchronize user',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
