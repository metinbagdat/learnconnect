import { ensureFirebaseBridgeTables, getSql } from './neon.js';

export async function getAppUserByFirebaseUid(firebaseUid) {
  const sql = getSql();
  await ensureFirebaseBridgeTables();

  const rows = await sql`
    SELECT
      u.id,
      u.username,
      u.email,
      u.display_name,
      u.role,
      l.firebase_uid
    FROM firebase_user_links l
    JOIN users u ON u.id = l.user_id
    WHERE l.firebase_uid = ${firebaseUid}
    LIMIT 1
  `;

  return rows[0] || null;
}
