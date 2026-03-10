# Troubleshoot egitim.today - Blank Page Issue

## Problem

egitim.today shows a blank page (purple gradient background, no content).

## Step-by-Step Troubleshooting

### Step 1: Check Framework Settings Build Command

**CRITICAL:** Framework Settings'te Build Command yanlış olabilir.

1. Go to: https://vercel.com/metinbahdats-projects/learn-connect/settings/git
2. Scroll down to **"Framework Settings"** section
3. Check **"Build Command"** field:
   - Should be: `npm run build:vercel || npm run build`
   - If it's just `npm run build`, **UPDATE IT**
4. Click **"Save"** if you made changes
5. Wait for new deployment to start

### Step 2: Check Deployment Status

1. Go to: https://vercel.com/metinbahdats-projects/learn-connect/deployments
2. Find the **latest deployment**
3. Check status:
   - ✅ **Ready** = Deployment successful
   - ⏳ **Building** = Wait for completion
   - ❌ **Error** = Check build logs
4. Click on the deployment to see details

### Step 3: Check Domain Assignment

1. Go to: https://vercel.com/metinbahdats-projects/learn-connect/settings/domains
2. Find **egitim.today**
3. Check:
   - **Status:** Should be "Active"
   - **Production Deployment:** Should show a deployment ID
   - If not assigned, click domain → "Assign to Production" → Select latest deployment

### Step 4: Clear Browser Cache

The blank page might be cached:

**Firefox:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cache"
3. Click "Clear Now"
4. Or use **Private Window** (Ctrl + Shift + P)

**Chrome/Edge:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. Or use **Incognito Mode** (Ctrl + Shift + N)

### Step 5: Check Browser Console

1. Open egitim.today in browser
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Look for errors:
   - ❌ Red errors = Problems
   - ⚠️ Yellow warnings = Usually OK (SES warnings are normal)
5. Check **Network** tab:
   - Are files loading? (200 status)
   - Are there 404 errors?
   - Is `index.html` loading?

### Step 6: Test Direct File Access

Try accessing files directly:

```
https://egitim.today/index.html
https://egitim.today/api/health
```

If `/api/health` works but `/index.html` doesn't, it's a routing issue.

### Step 7: Check Build Logs

1. Go to: https://vercel.com/metinbahdats-projects/learn-connect/deployments
2. Click on latest deployment
3. Click **"Build Logs"** tab
4. Look for:
   - ✅ "Build Completed" = Success
   - ❌ Errors = Problems to fix
   - ⚠️ Warnings = Usually OK

## Common Issues and Fixes

### Issue 1: Wrong Build Command

**Symptom:** Build fails or produces incorrect output

**Fix:**
- Framework Settings → Build Command → `npm run build:vercel || npm run build`
- Save → Wait for new deployment

### Issue 2: Domain Not Assigned

**Symptom:** Domain shows blank page or 404

**Fix:**
- Settings → Domains → egitim.today
- Assign to latest production deployment

### Issue 3: Cached Old Version

**Symptom:** Blank page even after deployment succeeds

**Fix:**
- Clear browser cache (Step 4)
- Use Private/Incognito window
- Hard refresh: `Ctrl + Shift + R`

### Issue 4: Build Failed

**Symptom:** Deployment status shows "Error"

**Fix:**
- Check Build Logs for errors
- Fix errors in code
- Push fixes → New deployment starts automatically

### Issue 5: Routing Not Working

**Symptom:** API works but frontend doesn't load

**Fix:**
- Check `vercel.json` rewrites configuration
- Should have: `"source": "/(.*)", "destination": "/index.html"`

## Quick Diagnostic Commands

```powershell
# Check API
curl https://egitim.today/api/health

# Check main page
curl -I https://egitim.today

# Check if HTML is returned
curl https://egitim.today | Select-String -Pattern "html|DOCTYPE"
```

## Expected Behavior

After fixing:
- ✅ https://egitim.today loads the React app
- ✅ API endpoints work: `/api/health` returns JSON
- ✅ No console errors (except suppressed SES warnings)
- ✅ Content visible (not blank page)

## Timeline

1. **Now:** Check Framework Settings Build Command
2. **1-2 min:** Wait for deployment (if triggered)
3. **After deployment:** Clear cache and test
4. **If still blank:** Check browser console and build logs

## Next Steps

1. **First:** Update Framework Settings Build Command if needed
2. **Then:** Wait for deployment to complete
3. **Finally:** Clear cache and test in Private Window
