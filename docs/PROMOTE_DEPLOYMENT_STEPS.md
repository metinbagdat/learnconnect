# 🚀 Step-by-Step: Promote Deployment to Production

## Quick Steps (2 minutes)

### Step 1: Open Vercel Deployments
1. Go to: **https://vercel.com/metinbahdats-projects/learn-connect/deployments**
2. You should see a list of deployments

### Step 2: Find the Right Deployment
Look for a deployment that has:
- ✅ **"Production: Staged"** badge (or just "Ready" status)
- ✅ **Branch:** `main` (not `preview/pr-8-main`)
- ✅ **Commit message:** "Add fix guide for egitim.today production dom..." or any recent commit from `main`

**Example:** Look for deployment `5zNXaE91c` or similar with:
- Status: "Ready" (green dot)
- Branch: `main`
- Commit: "Add fix guide for egitim.today production dom..."

### Step 3: Promote to Production
1. **Click the "..." menu** (three dots) on the right side of that deployment row
2. A dropdown menu will appear
3. **Click "Promote to Production"**
4. Confirm if asked

### Step 4: Wait for Deployment
- You'll see the deployment status change
- Wait 2-3 minutes for it to complete
- Status should show "Ready" when done

### Step 5: Verify
1. The deployment should now show **"Production"** badge
2. It should be assigned to your domain (eğitim.today)
3. Test the login endpoint

## Visual Guide

```
┌─────────────────────────────────────────────────────────┐
│ Deployments                                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [5zNXaE91c]  Production: Staged  Ready  main          │
│              "Add fix guide for egitim.today..."       │
│              1m ago by metinbagdat        [ ... ] ← Click here
│                                                         │
│  [H5UMZyhHH]  Preview  Ready  preview/pr-8-main         │
│              "Add test script for egitim.today..."     │
│                                                         │
└─────────────────────────────────────────────────────────┘

After clicking "..." menu:
┌─────────────────────────┐
│ Instant Rollback         │
│ Promote to Production ← Click this
│ Redeploy                 │
│ Inspect Deployment       │
│ View Source              │
│ Copy URL                 │
│ Cancel Deployment        │
│ Visit                    │
└─────────────────────────┘
```

## Which Deployment to Choose?

**Best choice:** The newest deployment from `main` branch with:
- Commit: "Add fix guide for egitim.today production dom..." (commit `9e20f0b`)
- OR: "Add test script for egitim.today production do..." (commit `adb1b3b`)
- OR: "Fix remaining console.error and add debuggin..." (commit `2afb3bb`)

**All of these include the fix** because they're built on top of commit `db0cc8c`.

## After Promotion

### Test Login Endpoint
```bash
curl -X POST https://xn--eitim-k1a.today/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

**Expected Result:**
- ✅ 200 OK (login successful)
- ✅ 401 Unauthorized (invalid credentials - also OK)
- ❌ 500 Internal Server Error (should NOT happen)

### Check Function Logs
1. Click on the promoted deployment
2. Click "Functions" tab
3. Click on `api/index.ts`
4. Click "View Function Logs"
5. Should NOT see `FUNCTION_INVOCATION_FAILED` errors

## Troubleshooting

### If "Promote to Production" is grayed out:
- The deployment might already be in production
- Or you might not have permissions
- Try "Redeploy" instead

### If you can't find a deployment from `main`:
- Check the "All Branches" filter
- Make sure `main` is selected
- Look for deployments with recent commit messages

### If promotion fails:
- Check if there's already a production deployment
- You might need to redeploy the current production instead
- Or contact Vercel support

## Quick Checklist

- [ ] Opened Vercel deployments page
- [ ] Found deployment from `main` branch
- [ ] Clicked "..." menu
- [ ] Clicked "Promote to Production"
- [ ] Waited for deployment to complete
- [ ] Tested login endpoint
- [ ] Verified no 500 errors

---

**Ready?** Go to the deployments page and promote the latest `main` branch deployment!

