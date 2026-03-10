# 🚀 START HERE - Deployment Guide

## ✅ What's Ready

- ✅ Firestore rules file (`firestore.rules`)
- ✅ Firebase configuration (`firebase.json`)
- ✅ Service account key (secure)
- ✅ Deployment scripts
- ✅ Vercel configuration

## 🎯 Quickest Deployment Path

### Method 1: Manual + GitHub (Recommended - No CLI Issues)

#### Step 1: Deploy Firestore Rules (2 minutes)

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/project/learnconnect-7c499/firestore/rules

2. **Copy Rules:**
   - Open `firestore.rules` file in your editor
   - Copy ALL content (Ctrl+A, Ctrl+C)

3. **Paste & Publish:**
   - In Firebase Console, click **Edit Rules**
   - Paste the rules (Ctrl+V)
   - Click **Publish**

✅ **Done!** Firestore rules are deployed.

#### Step 2: Commit & Push to GitHub

```powershell
# Add all new files
git add .

# Commit
git commit -m "Deploy: Add Firestore rules, deployment scripts, and configuration"

# Push to GitHub
git push origin main
```

#### Step 3: Deploy via Vercel Dashboard

1. **Go to Vercel:**
   - https://vercel.com/dashboard

2. **If project not connected:**
   - Click **Add New Project**
   - Import your GitHub repository
   - Configure:
     - Framework: **Vite**
     - Build Command: `npm run build`
     - Output Directory: `dist`

3. **Add Environment Variables:**
   - Go to **Settings** > **Environment Variables**
   - Add all variables (see `DEPLOYMENT_ENV_VARS.md`)
   - **Important:** Set for **Production**, **Preview**, and **Development**

4. **Deploy:**
   - Click **Deploy** (or it auto-deploys from GitHub)

✅ **Done!** Your app is deployed!

#### Step 4: Setup Admin (After Deployment)

Once deployed, run locally:

```powershell
# 1. Create admin in PostgreSQL
ts-node server/create-admin.ts admin@learnconnect.com Admin123! "System Admin"

# 2. Note the UID from output, then add to Firestore:
ts-node scripts/setup-firestore-admin.ts <uid> admin@learnconnect.com "System Admin"
```

#### Step 5: Seed Curriculum

```powershell
ts-node scripts/seed-firestore-curriculum.ts
```

## 📋 Environment Variables Checklist

Before deploying, ensure these are in Vercel:

### Backend (Required):
- [ ] `DATABASE_URL`
- [ ] `SESSION_SECRET`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `ANTHROPIC_MODEL`

### Frontend (Required - VITE_ prefix):
- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`

**Get Firebase values from:** https://console.firebase.google.com/project/learnconnect-7c499/settings/general

## 🎉 After Deployment

1. **Test your site:** Visit your Vercel URL
2. **Test admin login:** Go to `/admin`
3. **Verify Firestore:** Check Firebase Console
4. **Test AI features:** Generate curriculum in admin panel

## ⚡ Alternative: Use npx (No Global Install)

If you want to use CLI but avoid global installs:

```powershell
# Deploy Firestore rules
npx firebase-tools deploy --only firestore:rules

# Deploy to Vercel
npx vercel --prod
```

## 📚 Full Documentation

- `DEPLOYMENT.md` - Complete deployment guide
- `DEPLOY_QUICK_START.md` - Quick reference
- `DEPLOYMENT_ENV_VARS.md` - All environment variables

## 🆘 Need Help?

1. Check `DEPLOYMENT.md` for detailed steps
2. Review error messages carefully
3. Check Vercel/Firebase logs
4. Verify environment variables are set

---

**Ready? Start with Step 1 above!** 🚀
