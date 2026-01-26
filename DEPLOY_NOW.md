# 🚀 Deploy Now - Complete Guide

## Quick Start

Run the automated deployment script:

```powershell
.\scripts\deploy-all.ps1
```

Or follow the manual steps below.

## Prerequisites Check

### 1. Install Firebase CLI

```powershell
npm install -g firebase-tools
```

### 2. Install Vercel CLI

```powershell
npm install -g vercel
```

### 3. Login to Firebase

```powershell
firebase login
```

### 4. Login to Vercel

```powershell
vercel login
```

## Deployment Steps

### Step 1: Deploy Firestore Rules

```powershell
# Make sure you're in the project root
cd "c:\Users\mb\Desktop\LearnConnect\LearnConnect"

# Deploy rules
firebase deploy --only firestore:rules
```

**Expected Output:**
```
✅ Firestore rules deployed successfully!
```

**Verify:** Go to [Firebase Console](https://console.firebase.google.com/project/learnconnect-7c499/firestore/rules)

### Step 2: Setup Admin User

#### 2.1 Create Admin in PostgreSQL

```powershell
ts-node server/create-admin.ts admin@learnconnect.com Admin123! "System Admin"
```

**Note the UID from the output** - you'll need it for the next step.

#### 2.2 Add Admin to Firestore

```powershell
# Replace <uid> with the UID from step 2.1
ts-node scripts/setup-firestore-admin.ts <uid> admin@learnconnect.com "System Admin"
```

**Example:**
```powershell
ts-node scripts/setup-firestore-admin.ts abc123 admin@learnconnect.com "System Admin"
```

### Step 3: Seed MEB Curriculum

```powershell
ts-node scripts/seed-firestore-curriculum.ts
```

**Expected Output:**
```
✅ Curriculum seeded successfully!
   - Subjects: 7
   - Topics: 50+
   - Exam Types: TYT, AYT
```

**Verify:** Check Firestore Console for `curriculum/tyt/subjects` and `curriculum/ayt/subjects`

### Step 4: Deploy to Vercel

#### Option A: Deploy via CLI (Recommended)

```powershell
# Deploy to production
vercel --prod
```

#### Option B: Deploy via GitHub

1. Push your code to GitHub:
   ```powershell
   git add .
   git commit -m "Deploy: Firestore rules, admin setup, curriculum seed"
   git push origin main
   ```

2. Vercel will automatically deploy (if connected to GitHub)

#### Option C: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **Deployments** > **Redeploy**

## Environment Variables Check

Before deploying, ensure these are set in Vercel:

### Required:
- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `SESSION_SECRET` - Session encryption key
- ✅ `ANTHROPIC_API_KEY` - For AI features
- ✅ `ANTHROPIC_MODEL` - Model name (e.g., `claude-3-5-sonnet-20241022`)

### Frontend (VITE_ prefix):
- ✅ `VITE_FIREBASE_API_KEY`
- ✅ `VITE_FIREBASE_AUTH_DOMAIN`
- ✅ `VITE_FIREBASE_PROJECT_ID`
- ✅ `VITE_FIREBASE_STORAGE_BUCKET`
- ✅ `VITE_FIREBASE_MESSAGING_SENDER_ID`
- ✅ `VITE_FIREBASE_APP_ID`

**Set in Vercel:** Settings > Environment Variables

## Post-Deployment Verification

### 1. Test Admin Login

1. Go to your deployed URL: `https://your-project.vercel.app`
2. Navigate to `/admin` or login page
3. Login with admin credentials
4. Verify admin dashboard loads

### 2. Test Firestore Access

1. Go to [Firebase Console](https://console.firebase.google.com/project/learnconnect-7c499/firestore/data)
2. Verify curriculum data exists:
   - `curriculum/tyt/subjects`
   - `curriculum/ayt/subjects`
   - `admins/{uid}`

### 3. Test AI Features

1. Login as admin
2. Go to AI Curriculum Generator
3. Test:
   - Generate AYT Curriculum
   - Generate Learning Tree
   - Generate Study Plan
   - Save to Firestore

### 4. Check Deployment Logs

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Check **Deployments** > **Logs** for any errors

## Troubleshooting

### Firebase CLI Not Found

```powershell
npm install -g firebase-tools
```

### Vercel CLI Not Found

```powershell
npm install -g vercel
```

### Firestore Rules Deployment Fails

1. Check you're logged in: `firebase projects:list`
2. Verify `firebase.json` exists
3. Check `firestore.rules` syntax

### Admin Setup Fails

1. Verify service account key exists: `scripts/service-account-key.json`
2. Check key has proper permissions in Firebase Console
3. Verify project ID matches: `learnconnect-7c499`

### Curriculum Seed Fails

1. Check service account key is valid
2. Verify Firestore API is enabled
3. Check you have write permissions

### Vercel Deployment Fails

1. Check environment variables are set
2. Verify build command: `npm run build`
3. Check build logs in Vercel dashboard
4. Ensure all dependencies are in `package.json`

## Quick Commands Reference

```powershell
# Deploy everything
.\scripts\deploy-all.ps1

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Setup admin (after creating in PostgreSQL)
ts-node scripts/setup-firestore-admin.ts <uid> <email> <name>

# Seed curriculum
ts-node scripts/seed-firestore-curriculum.ts

# Deploy to Vercel
vercel --prod

# Check deployment status
vercel ls
```

## Next Steps After Deployment

1. ✅ Test all admin features
2. ✅ Verify Firestore data
3. ✅ Test AI generation
4. ✅ Monitor error logs
5. ✅ Set up monitoring/alerts (optional)
6. ✅ Configure custom domain (optional)

## Support

If you encounter issues:
1. Check the error messages
2. Review deployment logs
3. Verify environment variables
4. Check Firebase/Vercel documentation
5. Review `DEPLOYMENT.md` for detailed guide
