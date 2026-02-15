import { handleOptions, methodNotAllowed, sendJson } from '../_lib/http.js';
import { requireFirebaseUser } from '../_lib/require-user.js';
import { getAppUserByFirebaseUid } from '../_lib/app-user.js';
import { getSql } from '../_lib/neon.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  const methodError = methodNotAllowed(req, res, ['GET']);
  if (methodError) return methodError;

  const firebaseUser = await requireFirebaseUser(req, res);
  if (!firebaseUser) return;

  try {
    const appUser = await getAppUserByFirebaseUid(firebaseUser.uid);
    if (!appUser) {
      return sendJson(res, 404, {
        success: false,
        message: 'User is authenticated but not synchronized',
        nextAction: 'POST /api/auth/sync-user',
      });
    }

    const sql = getSql();
    const uploads = await sql`
      SELECT
        id,
        file_path AS "filePath",
        file_name AS "fileName",
        content_type AS "contentType",
        size_bytes AS "sizeBytes",
        metadata,
        created_at AS "createdAt"
      FROM user_uploads
      WHERE user_id = ${appUser.id}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    return sendJson(res, 200, {
      success: true,
      uploads,
    });
  } catch (error) {
    console.error('me/uploads error:', error);
    return sendJson(res, 500, {
      success: false,
      message: 'Failed to load uploads',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
