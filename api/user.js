import { getSql, ensureFirebaseBridgeTables } from './_lib/neon.js';
import { handleOptions, methodNotAllowed, sendJson } from './_lib/http.js';
import { requireFirebaseUser } from './_lib/require-user.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  const methodError = methodNotAllowed(req, res, ['GET']);
  if (methodError) return methodError;

  const firebaseUser = await requireFirebaseUser(req, res);
  if (!firebaseUser) return;

  try {
    const sql = getSql();
    await ensureFirebaseBridgeTables();

    const rows = await sql`
      SELECT
        u.id,
        u.username,
        u.email,
        u.display_name,
        u.role,
        u.created_at,
        u.updated_at,
        l.firebase_uid
      FROM firebase_user_links l
      JOIN users u ON u.id = l.user_id
      WHERE l.firebase_uid = ${firebaseUser.uid}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return sendJson(res, 404, {
        success: false,
        message: 'User is authenticated but not synchronized',
        nextAction: 'POST /api/auth/sync-user',
      });
    }

    const user = rows[0];
    return sendJson(res, 200, {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      email: user.email,
      role: user.role,
      firebaseUid: user.firebase_uid,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    });
  } catch (error) {
    console.error('/api/user error:', error);
    return sendJson(res, 500, {
      success: false,
      message: 'Failed to load user profile',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
