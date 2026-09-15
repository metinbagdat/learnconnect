# ⚠️ URGENT: Update DATABASE_URL to Fix SSL Error

## Current Problem
- ✅ Build is successful (dist/index.js 1.3mb)
- ❌ **SSL_ERROR_RX_RECORD_TOO_LONG** at runtime
- **Cause:** DATABASE_URL in Vercel is using **direct connection** instead of **pooler connection**

## Quick Fix (2 Steps)

### Step 1: Get Pooler Connection String

1. **Open Neon Console:**
   https://console.neon.tech/

2. **Select your project**

3. **Go to Connection Details:**
   - Click "Connection Details" or "Dashboard"
   - Find "Connection string" section

4. **⚠️ CRITICAL: Click "Pooler" tab**
   - **NOT** "Direct connection"
   - **MUST** be "Pooler" or "Connection pooling"

5. **Copy the connection string**
   - Should look like: `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`
   - **Must have `-pooler` in hostname**

### Step 2: Update in Vercel

#### Option A: Via CLI (Fastest)

```powershell
cd C:\Users\mb\Desktop\LearnConnect\LearnConnect
vercel env add DATABASE_URL production
```

**When prompted:**
1. Paste your pooler connection string
2. Press Enter
3. Type `y` when asked "Mark as sensitive?"
4. Press Enter

#### Option B: Via Dashboard

1. **Go to:**
   https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables

2. **Find DATABASE_URL (Production)**

3. **Click "Edit"**

4. **Paste pooler connection string**

5. **Select "Production" environment**

6. **Click "Save"**

### Step 3: Redeploy

**After updating, you MUST redeploy:**

1. **Go to:**
   https://vercel.com/metinbahdats-projects/learn-connect/deployments

2. **Click "..." on latest deployment**

3. **Click "Redeploy"**

4. **Wait for completion**

### Step 4: Verify Fix

Visit: https://learn-connect.vercel.app/api/health

Should return: `{"status":"ok","timestamp":"..."}`

**No more SSL errors!** ✅

---

## How to Verify Connection String Format

**✅ CORRECT (Pooler):**
```
postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```
- Has `-pooler` in hostname
- Ends with `?sslmode=require`

**❌ WRONG (Direct - causes SSL error):**
```
postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb
```
- No `-pooler` in hostname
- Missing `?sslmode=require`

---

## Quick Command Reference

```powershell
# 1. Update DATABASE_URL
vercel env add DATABASE_URL production

# 2. Redeploy
vercel --prod

# 3. Check status
vercel env ls
```

---

**After updating and redeploying, the SSL error will be fixed!** 🎉

