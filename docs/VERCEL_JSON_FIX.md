# Fixed vercel.json Schema Validation Error

## ✅ Problem Fixed

**Error:** `should NOT have additional property 'productionBranch'`

**Cause:** `productionBranch` is NOT a valid property in `vercel.json`. It's a **project setting** in Vercel dashboard, not a config file property.

## 🔧 Changes Made

Removed invalid properties from `vercel.json`:
- ❌ `productionBranch: "main"` - This is configured in Vercel dashboard settings, not in config file
- ❌ `autoAlias: true` (at root level) - Already inside `github` object where it belongs

## ✅ Valid vercel.json Structure

```json
{
  "version": 2,
  "buildCommand": "npm run build:vercel || npm run build",
  "outputDirectory": "dist/public",
  "installCommand": "npm install --include=dev",
  "github": {
    "enabled": true,
    "autoAlias": true,
    "autoJobCancelation": true,
    "silent": false
  },
  "rewrites": [...],
  "headers": [...],
  "build": {
    "env": {...}
  }
}
```

## 📋 Valid Properties in vercel.json

✅ **Allowed:**
- `version`
- `buildCommand`
- `outputDirectory`
- `installCommand`
- `rewrites`
- `headers`
- `functions`
- `github` (object)
- `build` (object)
- `routes`
- `redirects`
- `crons`

❌ **NOT Allowed:**
- `productionBranch` - Set in Vercel dashboard (Settings → Build and Deployment)
- `autoAlias` at root - Only inside `github` object
- `regions` - Set in Vercel dashboard

## 🎯 Next Steps

The build should now pass validation. The deployment will:
1. ✅ Pass schema validation
2. ⚠️ Still need to fix deployment checks (if they're configured)
3. ✅ Allow domain assignment after checks pass

**Note:** `productionBranch` is configured in:
- Vercel Dashboard → Settings → Build and Deployment → Production Branch
- Default value: `main` (which is what you want)
