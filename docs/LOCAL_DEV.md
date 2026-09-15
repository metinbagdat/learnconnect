# Local Development Guide

## UTF-8 Encoding (Windows)

Turkish characters (Öğrenme, etc.) may appear as `Ã–ÄŸrenme` in PowerShell. To fix:

```powershell
chcp 65001
```

Run this before `npm run dev` for correct display. Alternatively, use Windows Terminal or VS Code's integrated terminal which handle UTF-8 by default.

## Firebase (auth/invalid-api-key)

When `VITE_FIREBASE_*` env vars are not set, Firebase is not initialized. You'll see:

- Console message: `[LearnConnect] Firebase not configured (missing VITE_FIREBASE_* env vars)...`
- Admin panel shows "Firebase not configured" instead of login

This is expected for frontend-only local dev. To enable admin panel:

1. Copy `.env.example` to `.env.local`
2. Add Firebase config from Firebase Console (Project Settings → General → Web app)
3. Restart dev server

## Backend API

For full stack (auth, TYT tasks, etc.):

1. **Option A:** Run `vercel dev` for a full local stack
2. **Option B:** Run backend separately: `node test-api.js` (if available)
3. Ensure `DATABASE_URL` and `SESSION_SECRET` are set in `.env.local` for backend

Demo accounts (session auth):
- `demo` / `demo123` (student)
- `admin` / `admin123` (admin)
- `teacher` / `teacher123` (teacher)
