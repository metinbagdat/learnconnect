# Verify and Update DATABASE_URL in Vercel

## ✅ Current Status

From Vercel CLI check:
- ✅ **DATABASE_URL** is set in Production (created 3 days ago)
- ✅ Also set in Development and Preview environments

However, we need to **verify the format** to ensure it's the correct pooler connection string.

## 🔍 Step 1: Check Current DATABASE_URL Format

### Option A: Vercel Dashboard (Recommended)

1. **Open Vercel Dashboard:**
   https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables

2. **Find DATABASE_URL:**
   - Look for the Production environment entry
   - Click on it to view/edit

3. **Verify the format:**
   The connection string should:
   - ✅ Start with `postgresql://` (NOT `https://`)
   - ✅ Contain `-pooler` in the hostname OR use port `5432`
   - ✅ End with `?sslmode=require`

   **Correct format example:**
   ```
   postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```

   **Wrong format (causes SSL_ERROR_RX_RECORD_TOO_LONG):**
   ```
   https://ep-xxx.region.aws.neon.tech  ❌
   postgresql://ep-xxx.region.aws.neon.tech/neondb  ❌ (missing pooler)
   ```

### Option B: Pull Environment Variables Locally

```powershell
cd C:\Users\mb\Desktop\LearnConnect\LearnConnect
vercel env pull .env.local
```

Then check the `.env.local` file (note: values may be masked for security).

## 🔧 Step 2: Update if Needed

If the DATABASE_URL format is incorrect, follow these steps:

### Get the Correct Pooler Connection String

1. **Go to Neon Console:**
   https://console.neon.tech/

2. **Select your project**

3. **Go to Connection Details:**
   - Click on "Connection Details" or "Dashboard"
   - Look for "Connection string" section

4. **Select POOLER connection:**
   - **IMPORTANT:** Click on "Pooler" or "Connection pooling" tab
   - **NOT** the "Direct connection" tab
   - Copy the connection string

5. **Verify it contains:**
   - `-pooler` in the hostname, OR
   - Port `5432` specified
   - `?sslmode=require` at the end

### Update in Vercel Dashboard

1. **Go to:**
   https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables

2. **Find DATABASE_URL (Production)**

3. **Click Edit** (or Remove and Add New)

4. **Paste the pooler connection string**

5. **Select Environment:** Production ✅

6. **Click Save**

### Update via CLI (Alternative)

```powershell
cd C:\Users\mb\Desktop\LearnConnect\LearnConnect
vercel env add DATABASE_URL production
# When prompted, paste your pooler connection string
# When asked "Mark as sensitive?", type: y
```

## 🚀 Step 3: Redeploy

After updating DATABASE_URL:

1. **Go to Deployments:**
   https://vercel.com/metinbahdats-projects/learn-connect/deployments

2. **Click "..." on the latest deployment**

3. **Click "Redeploy"**

4. **Wait for deployment to complete**

5. **Test your app:**
   - Visit: https://learn-connect.vercel.app
   - Check browser console for errors
   - Try: https://learn-connect.vercel.app/api/health

## ✅ Verification Checklist

- [ ] Checked DATABASE_URL format in Vercel dashboard
- [ ] Confirmed it starts with `postgresql://`
- [ ] Confirmed it uses pooler connection (has `-pooler` or port `5432`)
- [ ] Confirmed it ends with `?sslmode=require`
- [ ] Updated if needed with correct pooler connection string
- [ ] Redeployed the application
- [ ] Tested the deployment (no SSL errors)

## 🆘 If You Still See SSL Errors

1. **Check Vercel deployment logs:**
   - Go to your deployment
   - Click "View Function Logs"
   - Look for database connection errors

2. **Verify in Neon Console:**
   - Make sure your database endpoint is active (not paused)
   - Check connection details match what you set in Vercel

3. **Test the connection string locally:**
   ```powershell
   # Create .env file with the connection string
   # Then run:
   npm run db:verify
   ```

## 🔗 Quick Links

- **Vercel Environment Variables:** https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables
- **Neon Console:** https://console.neon.tech/
- **Vercel Deployments:** https://vercel.com/metinbahdats-projects/learn-connect/deployments
- **Fix SSL Error Guide:** FIX_SSL_ERROR.md

