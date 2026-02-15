import { handleOptions, methodNotAllowed, sendJson } from '../_lib/http.js';
import { requireFirebaseUser } from '../_lib/require-user.js';
import { getAppUserByFirebaseUid } from '../_lib/app-user.js';

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

    return sendJson(res, 200, {
      success: true,
      profile: {
        id: appUser.id,
        firebaseUid: appUser.firebase_uid,
        username: appUser.username,
        email: appUser.email,
        displayName: appUser.display_name,
        role: appUser.role,
      },
    });
  } catch (error) {
    console.error('me/profile error:', error);
    return sendJson(res, 500, {
      success: false,
      message: 'Failed to load profile',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
