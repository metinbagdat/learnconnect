import crypto from 'crypto';
import { handleOptions, methodNotAllowed, sendJson } from '../_lib/http.js';
import { requireFirebaseUser } from '../_lib/require-user.js';
import { getFirebaseAdminStorage } from '../_lib/firebase-admin.js';

const DEFAULT_UPLOAD_FOLDER = 'uploads';

function normalizeFileName(fileName) {
  return (fileName || 'file')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120);
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  const methodError = methodNotAllowed(req, res, ['POST']);
  if (methodError) return methodError;

  const firebaseUser = await requireFirebaseUser(req, res);
  if (!firebaseUser) return;

  const fileName = normalizeFileName(req.body?.fileName);
  const contentType = req.body?.contentType || 'application/octet-stream';
  const folder = (req.body?.folder || DEFAULT_UPLOAD_FOLDER).replace(/[^a-zA-Z0-9/_-]/g, '');

  if (!fileName) {
    return sendJson(res, 400, { success: false, message: 'fileName is required' });
  }

  try {
    const storage = getFirebaseAdminStorage();
    const bucket = storage.bucket();

    const nonce = crypto.randomBytes(8).toString('hex');
    const filePath = `${folder}/${firebaseUser.uid}/${Date.now()}-${nonce}-${fileName}`;
    const expiresAtMs = Date.now() + 15 * 60 * 1000;

    const [signedUrl] = await bucket.file(filePath).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: expiresAtMs,
      contentType,
    });

    return sendJson(res, 200, {
      success: true,
      upload: {
        signedUrl,
        filePath,
        contentType,
        expiresAt: new Date(expiresAtMs).toISOString(),
      },
    });
  } catch (error) {
    console.error('create-upload-url error:', error);
    return sendJson(res, 500, {
      success: false,
      message: 'Failed to create upload URL',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
