# Neon + Firebase MVP Checklist (Implemented)

This project now supports a split architecture:
- Firebase Auth + Firebase Storage
- Neon PostgreSQL for application data

## Ordered implementation (concrete list)

### 1) Firebase token verification middleware
Implemented in:
- `api/_lib/firebase-admin.js`
- `api/_lib/require-user.js`
- `api/_lib/http.js`

What it does:
- Verifies `Authorization: Bearer <idToken>` using Firebase Admin
- Normalizes unauthorized responses for all protected routes
- Handles CORS and OPTIONS preflight

### 2) User sync endpoint (Firebase UID -> Neon user)
Implemented in:
- `api/auth/sync-user.js`
- `api/_lib/neon.js`
- `api/_lib/app-user.js`

What it does:
- Creates bridge table `firebase_user_links` if missing
- Upserts link between Firebase UID and `users.id`
- Updates email/display name in Neon from Firebase claims

### 3) Storage upload flow
Implemented in:
- `api/storage/create-upload-url.js`
- `api/storage/complete-upload.js`

What it does:
- Generates signed Firebase Storage upload URL (authenticated)
- Records upload metadata in Neon table `user_uploads`

### 4) Protected Neon query endpoints
Implemented in:
- `api/user.js`
- `api/me/profile.js`
- `api/me/enrollments.js`
- `api/me/uploads.js`

What it does:
- Returns profile/enrollment/upload data for the authenticated Firebase user
- Requires existing UID-to-user mapping from sync step

### 5) Frontend auth token wiring
Implemented in:
- `client/src/lib/api-auth.ts`
- `client/src/hooks/use-auth.ts`
- `client/src/App.tsx`

What it does:
- Gets Firebase ID token from current user
- Calls `POST /api/auth/sync-user` before protected Neon reads
- Uses token-authenticated requests for `/api/user`

### 6) Required dependencies and env vars
Updated in:
- `package.json`
- `.env.example`

Added dependencies:
- `@neondatabase/serverless`
- `firebase-admin`

Added env vars:
- `DATABASE_URL`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_*`

## API summary

- `POST /api/auth/sync-user`
- `GET /api/user`
- `GET /api/me/profile`
- `GET /api/me/enrollments`
- `GET /api/me/uploads`
- `POST /api/storage/create-upload-url`
- `POST /api/storage/complete-upload`

All protected endpoints require:

`Authorization: Bearer <firebase_id_token>`

## Notes

- `api/_lib/neon.js` creates bridge/upload tables if missing.
- Existing Neon `users`, `user_courses`, `courses` tables are used for profile and enrollments.
- If a user is authenticated but not synced, API returns `nextAction: POST /api/auth/sync-user`.
