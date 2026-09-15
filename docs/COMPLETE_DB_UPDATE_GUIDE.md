# Complete Guide: Update DATABASE_URL in Vercel

## 🎯 Goal
Update DATABASE_URL in Vercel to use the correct Neon pooler connection string to fix SSL_ERROR_RX_RECORD_TOO_LONG.

---

## 📋 Step 1: Get Pooler Connection String from Neon

### 1.1 Open Neon Console
Go to: **https://console.neon.tech/**

### 1.2 Select Your Project
- Click on your project (likely named something like "neondb" or your project name)

### 1.3 Navigate to Connection Details
- Click on **"Connection Details"** or go to **"Dashboard"**
- Look for the **"Connection string"** section

### 1.4 Select POOLER Connection (⚠️ CRITICAL)
- You'll see tabs: **"Direct connection"** and **"Pooler"** or **"Connection pooling"**
- **⚠️ IMPORTANT:** Click on **"Pooler"** tab (NOT "Direct connection")
- This is required for `@neondatabase/serverless` driver

### 1.5 Copy the Connection String
The connection string should look like:
```
postgresql://username:password@ep-xxxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Key indicators it's the pooler:**
- ✅ Hostname contains `-pooler` (e.g., `ep-xxx-pooler.region.aws.neon.tech`)
- ✅ OR port `5432` is specified
- ✅ Ends with `?sslmode=require`

**❌ WRONG (Direct connection - will cause SSL error):**
```
postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb
```
(No `-pooler` in hostname, no port specified)

---

## 📋 Step 2: Update DATABASE_URL in Vercel

### Option A: Via Vercel Dashboard (Easiest)

1. **Open Vercel Dashboard:**
   https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables

2. **Find DATABASE_URL:**
   - Look for the entry with **"Production"** environment
   - It was created 3 days ago

3. **Edit the Variable:**
   - Click on **DATABASE_URL** (Production)
   - Click **"Edit"** button
   - OR click **"Remove"** and then **"Add New"**

4. **Paste Pooler Connection String:**
   - Paste the pooler connection string you copied from Neon
   - Make sure it's the complete string

5. **Select Environment:**
   - Make sure **"Production"** is selected ✅
   - You can also add it to **"Preview"** and **"Development"** if needed

6. **Save:**
   - Click **"Save"** button

### Option B: Via Vercel CLI

1. **Open PowerShell in project directory:**
   ```powershell
   cd C:\Users\mb\Desktop\LearnConnect\LearnConnect
   ```

2. **Run the command:**
   ```powershell
   vercel env add DATABASE_URL production
   ```

3. **When prompted:**
   - Paste your pooler connection string
   - Press Enter
   - When asked "Mark as sensitive?", type: **y**
   - Press Enter

4. **Verify it was added:**
   ```powershell
   vercel env ls
   ```
   You should see DATABASE_URL listed for Production.

---

## 📋 Step 3: Redeploy Application

After updating DATABASE_URL, you must redeploy for changes to take effect.

### Via Dashboard:

1. **Go to Deployments:**
   https://vercel.com/metinbahdats-projects/learn-connect/deployments

2. **Find Latest Deployment:**
   - Look for the most recent deployment

3. **Redeploy:**
   - Click the **"..."** (three dots) menu
   - Click **"Redeploy"**
   - Confirm the redeploy

4. **Wait for Completion:**
   - Watch the deployment logs
   - Wait until status shows "Ready"

### Via CLI:

```powershell
cd C:\Users\mb\Desktop\LearnConnect\LearnConnect
vercel --prod
```

---

## 📋 Step 4: Verify the Fix

### 4.1 Test the Deployment

1. **Visit your app:**
   https://learn-connect.vercel.app

2. **Check browser console:**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for any SSL errors

3. **Test API endpoint:**
   https://learn-connect.vercel.app/api/health
   - Should return: `{"status":"ok","timestamp":"..."}`

### 4.2 Check Deployment Logs

1. **Go to your deployment:**
   https://vercel.com/metinbahdats-projects/learn-connect/deployments

2. **Click on the latest deployment**

3. **Check Function Logs:**
   - Look for any database connection errors
   - Should see successful connection messages

### 4.3 Expected Results

✅ **Success indicators:**
- No SSL_ERROR_RX_RECORD_TOO_LONG in browser console
- API endpoints respond correctly
- Database queries work
- No connection errors in logs

❌ **If still seeing errors:**
- Double-check connection string format
- Verify it's the pooler connection (has `-pooler` in hostname)
- Check Neon console - ensure database endpoint is active
- Review deployment logs for specific error messages

---

## 🔍 Troubleshooting

### Error: "Connection refused"
- Check Neon console - database endpoint might be paused
- Resume the endpoint in Neon Console

### Error: "SSL required"
- Make sure connection string ends with `?sslmode=require`

### Error: Still seeing SSL_ERROR_RX_RECORD_TOO_LONG
- Verify you're using the **pooler** connection string (not direct)
- Check that connection string starts with `postgresql://` (not `https://`)
- Try removing and re-adding the environment variable

### Connection String Format Issues

**✅ CORRECT:**
```
postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

**❌ WRONG:**
```
https://ep-xxx.region.aws.neon.tech  ❌
postgresql://ep-xxx.region.aws.neon.tech/neondb  ❌ (missing pooler)
postgresql://ep-xxx.region.aws.neon.tech/neondb?sslmode=require  ❌ (missing pooler)
```

---

## 📝 Quick Checklist

- [ ] Got pooler connection string from Neon Console
- [ ] Verified connection string has `-pooler` in hostname OR port `5432`
- [ ] Verified connection string ends with `?sslmode=require`
- [ ] Updated DATABASE_URL in Vercel (Production environment)
- [ ] Redeployed the application
- [ ] Tested the deployment - no SSL errors
- [ ] API endpoints working correctly

---

## 🔗 Quick Links

- **Neon Console:** https://console.neon.tech/
- **Vercel Environment Variables:** https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables
- **Vercel Deployments:** https://vercel.com/metinbahdats-projects/learn-connect/deployments
- **Your App:** https://learn-connect.vercel.app

---

## 🚀 Automated Script

You can also run the PowerShell script:
```powershell
cd C:\Users\mb\Desktop\LearnConnect\LearnConnect
.\update-vercel-db.ps1
```

This will guide you through all the steps interactively.

