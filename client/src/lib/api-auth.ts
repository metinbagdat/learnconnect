import { auth } from '@/lib/firebase';

export async function getFirebaseAuthHeaders(additionalHeaders: Record<string, string> = {}) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return {
      ...additionalHeaders,
    };
  }

  const idToken = await currentUser.getIdToken();
  return {
    Authorization: `Bearer ${idToken}`,
    ...additionalHeaders,
  };
}

export async function syncFirebaseUserToNeon() {
  const headers = await getFirebaseAuthHeaders({
    'Content-Type': 'application/json',
  });

  if (!headers.Authorization) {
    return { success: false, skipped: true };
  }

  const response = await fetch('/api/auth/sync-user', {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`sync-user failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function fetchWithFirebaseAuth(input: RequestInfo | URL, init?: RequestInit) {
  const headers = await getFirebaseAuthHeaders(
    (init?.headers as Record<string, string> | undefined) || {},
  );

  return fetch(input, {
    ...init,
    headers,
  });
}
