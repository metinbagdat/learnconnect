import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

function normalizePrivateKey(key) {
  if (!key) return '';
  return key.replace(/\\n/g, '\n');
}

function getFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin env vars: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket,
  });
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminStorage() {
  return getStorage(getFirebaseAdminApp());
}

export async function verifyFirebaseIdTokenFromRequest(req) {
  const authorization = req.headers.authorization || req.headers.Authorization;
  if (!authorization || typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    throw new Error('Missing bearer token');
  }

  const idToken = authorization.substring('Bearer '.length).trim();
  if (!idToken) {
    throw new Error('Empty bearer token');
  }

  const auth = getFirebaseAdminAuth();
  return auth.verifyIdToken(idToken, true);
}
