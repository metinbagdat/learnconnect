# 🚀 Quick Deployment Guide

## Current Status

✅ **Ready to Deploy:**
- Firestore rules file exists
- Service account key ready
- Deployment scripts created
- Vercel configuration ready

⚠️ **Note:** Node.js version issue detected (v18.20.0, Firebase CLI requires v20+)

## Deployment Options

### Option 1: Deploy via Vercel Dashboard (Easiest)

**No CLI needed!**

1. **Push to GitHub:**
   ```powershell
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy in Vercel Dashboard:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - If project not connected, click **Add New Project**
   - Import from GitHub
   - Configure:
     - **Framework Preset:** Vite
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
   - Add environment variables (see below)
   - Click **Deploy**

### Option 2: Use npx (No Global Install)

Instead of installing globally, use npx:

```powershell
# Deploy Firestore rules (no install needed)
npx firebase-tools deploy --only firestore:rules

# Deploy to Vercel (no install needed)
npx vercel --prod
```

### Option 3: Manual Firebase Rules Deployment

1. Go to [Firebase Console](https://console.firebase.google.com/project/learnconnect-7c499/firestore/rules)
2. Click **Edit Rules**
3. Copy contents from `firestore.rules`
4. Paste into the editor
5. Click **Publish**

## Environment Variables for Vercel

**Go to:** Vercel Dashboard > Your Project > Settings > Environment Variables

### Backend Variables:
```
DATABASE_URL=your-postgresql-connection-string
SESSION_SECRET=n8ptitsx2a41w6e5qzKt4v4yqT4PmuVam2WGC8dyr2U=
ANTHROPIC_API_KEY=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
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### Frontend Variables (VITE_ prefix):
```
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=learnconnect-7c499.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=learnconnect-7c499
VITE_FIREBASE_STORAGE_BUCKET=learnconnect-7c499.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Get Firebase config from:** [Firebase Console](https://console.firebase.google.com/project/learnconnect-7c499/settings/general)

## Step-by-Step Deployment

### 1. Deploy Firestore Rules (Manual - Easiest)

1. Open [Firebase Console](https://console.firebase.google.com/project/learnconnect-7c499/firestore/rules)
2. Click **Edit Rules**
3. Copy entire content from `firestore.rules` file
4. Paste into editor
5. Click **Publish**

✅ **Done!** Rules are now deployed.

### 2. Setup Admin (After Deployment)

Once your app is deployed, you can setup admin via the admin panel or run:

```powershell
# Create admin in PostgreSQL
ts-node server/create-admin.ts admin@learnconnect.com Admin123! "System Admin"

# Add to Firestore (get UID from above)
ts-node scripts/setup-firestore-admin.ts <uid> admin@learnconnect.com "System Admin"
```

### 3. Seed Curriculum

```powershell
ts-node scripts/seed-firestore-curriculum.ts
```

### 4. Deploy to Vercel

**Via GitHub (Recommended):**
1. Push code: `git push origin main`
2. Vercel auto-deploys

**Via Vercel Dashboard:**
1. Go to Vercel Dashboard
2. Click **Deploy** or **Redeploy**

## Verification Checklist

After deployment:

- [ ] Firestore rules deployed (check Firebase Console)
- [ ] Vercel deployment successful (check Vercel dashboard)
- [ ] Environment variables set (check Vercel settings)
- [ ] Site accessible (visit your Vercel URL)
- [ ] Admin login works (test at `/admin`)
- [ ] Firestore data visible (check Firebase Console)

## Quick Commands

```powershell
# Check Node version (should be 20+ for Firebase CLI)
node --version

# If Node 18, use npx instead:
npx firebase-tools deploy --only firestore:rules
npx vercel --prod

# Or deploy via GitHub push (no CLI needed)
git push origin main
```

## Troubleshooting

### Node Version Issue

If you get Node version warnings:
- Use `npx` instead of global install
- Or upgrade Node.js to v20+
- Or use Vercel Dashboard (no CLI needed)

### SSL Errors

If you get SSL errors:
- Check internet connection
- Try again later
- Use manual deployment methods

### Missing Environment Variables

- Check Vercel dashboard
- Verify all variables are set
- Redeploy after adding variables

## Next Steps

1. ✅ Deploy Firestore rules (manual method above)
2. ✅ Set environment variables in Vercel
3. ✅ Push to GitHub or deploy via Vercel dashboard
4. ✅ Test admin login
5. ✅ Seed curriculum data
6. ✅ Test AI features
