import { sendJson } from './http.js';
import { verifyFirebaseIdTokenFromRequest } from './firebase-admin.js';

export async function requireFirebaseUser(req, res) {
  try {
    const decodedToken = await verifyFirebaseIdTokenFromRequest(req);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      name: decodedToken.name || null,
      picture: decodedToken.picture || null,
      decodedToken,
    };
  } catch (error) {
    sendJson(res, 401, {
      success: false,
      message: 'Unauthorized: invalid or missing Firebase token',
    });
    return null;
  }
}
