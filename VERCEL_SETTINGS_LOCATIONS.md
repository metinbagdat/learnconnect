# Vercel Settings Locations - Where to Find Everything

## ❌ Settings NOT in Git Section

The following settings are **NOT** in the Git settings page you're currently viewing:

### 1. "Auto-assign Custom Domains"

**Location:** Settings → **Build and Deployment** → Scroll down to "Production Deployments" section

**Path:**
1. Go to: https://vercel.com/metinbahdats-projects/learn-connect/settings
2. Click **"Build and Deployment"** (second item in left sidebar)
3. Scroll down to **"Production Deployments"** section
4. Look for **"Auto-assign Custom Domains"** toggle
5. Enable it (toggle should be blue/on)

**Alternative location:** This might also be in:
- Settings → **Domains** → Domain settings for each domain

### 2. "Production Branch Protection" / "Automatically promote after checks pass"

**Location:** Settings → **Deployment Protection**

**Path:**
1. Go to: https://vercel.com/metinbahdats-projects/learn-connect/settings
2. Click **"Deployment Protection"** (should be visible in left sidebar)
3. Look for **"Production Branch Protection"** section
4. Options you might see:
   - **"Require approval"** - Manual promotion required
   - **"Automatically promote"** - Auto-promotes after checks pass
   - **"Bypass protection"** - No protection (not recommended)
5. Select **"Automatically promote"** if available

**If "Deployment Protection" doesn't exist:**
- This might be a team/enterprise feature
- For Hobby plan, automatic promotion might be the default
- Check Settings → **Build and Deployment** → "Production Branch" section instead

## ✅ Current Git Settings (What You're Looking At)

The Git settings page shows:
- Connected repository: `metinbagdat/learnconnect-`
- Pull Request Comments: Enabled
- Commit Comments: Enabled
- Require Verified Commits: Enabled
- deployment_status Events: Enabled
- repository_dispatch Events: Enabled

**These are correct** - no changes needed here.

## 🔍 Step-by-Step: Finding Production Settings

### Option 1: Build and Deployment Settings

1. **Navigate to:**
   ```
   https://vercel.com/metinbahdats-projects/learn-connect/settings
   ```

2. **Click:** "Build and Deployment" (in left sidebar)

3. **Look for these sections:**
   - **"Production Branch"** - Should show `main`
   - **"Production Deployments"** - May have auto-assign options
   - **"Git Integration"** - Branch settings

4. **If you see "Auto-assign Custom Domains":**
   - Toggle it ON

### Option 2: Deployment Protection (If Available)

1. **Navigate to:**
   ```
   https://vercel.com/metinbahdats-projects/learn-connect/settings/deployment-protection
   ```

2. **Or try:**
   ```
   https://vercel.com/metinbahdats-projects/learn-connect/settings/protection
   ```

3. **Look for:**
   - Production branch protection rules
   - Auto-promotion settings
   - Approval workflows

### Option 3: Check Domain Settings

1. **Go to:**
   ```
   https://vercel.com/metinbahdats-projects/learn-connect/settings/domains
   ```

2. **For each domain (egitim.today):**
   - Check if there's an "Auto-assign" option
   - Domain should be assigned to "Production" deployment

## 🎯 What to Actually Do Right Now

Since these settings might not be available on Hobby plan, focus on **manual promotion**:

### Immediate Action (Manual Promotion):

1. **Go to Deployments:**
   ```
   https://vercel.com/metinbahdats-projects/learn-connect/deployments
   ```

2. **Find Latest Deployment:**
   - Should be from recent commits (within last few minutes)
   - Look for commit messages like "fix: Enhanced SES error suppression..."

3. **Check Status:**
   - If status is **"Ready"** ✅
   - If it says **"Production: Staged"** or just shows as latest

4. **Promote to Production:**
   - Click on the deployment row
   - Look for **"..."** (three dots) menu in top right
   - Click **"Promote to Production"** (if available)
   - OR click **"Redeploy"** → Select **"Use existing Build Cache"** → Confirm

5. **Verify Domain Assignment:**
   - After promotion, check if `egitim.today` is assigned
   - If not, go to Settings → Domains
   - Manually assign domain to the promoted deployment

## 📋 Vercel Plan Limitations

**Hobby Plan** might not have:
- Automatic production promotion
- Deployment protection rules
- Advanced auto-assignment features

**Workaround:**
- Use manual promotion (works on all plans)
- Set up GitHub Actions for automated deployment (free)
- Monitor deployments and promote manually when needed

## 🔧 Alternative: Use GitHub Actions for Auto-Deployment

If automatic promotion isn't available, create a GitHub Action:

**File: `.github/workflows/deploy-production.yml`**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

This will automatically deploy to production when you push to `main`.

## ✅ What You Can Verify Right Now

1. **Check Production Branch:**
   - Settings → Build and Deployment
   - "Production Branch" should be `main`

2. **Check Latest Deployment:**
   - Go to Deployments page
   - See if latest deployment is "Ready"
   - Promote it manually if needed

3. **Check Domain Assignment:**
   - Settings → Domains
   - Verify `egitim.today` is assigned to a deployment
   - If not, assign it to the latest working deployment

---

**Bottom Line:** On Hobby plan, you'll likely need to manually promote deployments. The key is to:
1. Check Deployments page regularly
2. Promote "Ready" deployments to production manually
3. Ensure domains are assigned correctly
