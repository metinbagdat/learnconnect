import { handleOptions, methodNotAllowed, sendJson } from '../_lib/http.js';
import { requireFirebaseUser } from '../_lib/require-user.js';
import { getAppUserByFirebaseUid } from '../_lib/app-user.js';
import { ensureFirebaseBridgeTables, getSql } from '../_lib/neon.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  const methodError = methodNotAllowed(req, res, ['POST']);
  if (methodError) return methodError;

  const firebaseUser = await requireFirebaseUser(req, res);
  if (!firebaseUser) return;

  const filePath = req.body?.filePath;
  const fileName = req.body?.fileName || null;
  const contentType = req.body?.contentType || null;
  const sizeBytes = Number.isFinite(Number(req.body?.sizeBytes)) ? Number(req.body.sizeBytes) : null;
  const metadata = req.body?.metadata && typeof req.body.metadata === 'object' ? req.body.metadata : null;

  if (!filePath || typeof filePath !== 'string') {
    return sendJson(res, 400, { success: false, message: 'filePath is required' });
  }

  try {
    const appUser = await getAppUserByFirebaseUid(firebaseUser.uid);
    if (!appUser) {
      return sendJson(res, 404, {
        success: false,
        message: 'User is not synchronized',
        nextAction: 'POST /api/auth/sync-user',
      });
    }

    await ensureFirebaseBridgeTables();
    const sql = getSql();

    const inserted = await sql`
      INSERT INTO user_uploads (
        user_id,
        firebase_uid,
        file_path,
        file_name,
        content_type,
        size_bytes,
        metadata,
        created_at
      )
      VALUES (
        ${appUser.id},
        ${firebaseUser.uid},
        ${filePath},
        ${fileName},
        ${contentType},
        ${sizeBytes},
        ${metadata ? JSON.stringify(metadata) : null}::jsonb,
        now()
      )
      RETURNING id, user_id, firebase_uid, file_path, file_name, content_type, size_bytes, metadata, created_at
    `;

    return sendJson(res, 200, {
      success: true,
      message: 'Upload recorded',
      upload: inserted[0],
    });
  } catch (error) {
    console.error('complete-upload error:', error);
    return sendJson(res, 500, {
      success: false,
      message: 'Failed to record upload',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
