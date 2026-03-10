# Environment Variables Checklist for Vercel

## ⚠️ CRITICAL - Server Will Fail Without These

These variables MUST be set in Vercel Production environment:

### 1. DATABASE_URL
- **Type:** Required
- **Value:** Neon PostgreSQL pooler connection string
- **Format:** `postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`
- **Important:** Must include `-pooler` in hostname
- **Set in:** Vercel Dashboard → Environment Variables → Production

### 2. ANTHROPIC_API_KEY
- **Type:** Required
- **Value:** `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`
- **Set in:** Vercel Dashboard → Environment Variables → Production
- **Or use:** `scripts/set-vercel-env.ps1` script

### 3. ANTHROPIC_MODEL
- **Type:** Required
- **Value:** `claude-3-5-sonnet-20241022`
- **Set in:** Vercel Dashboard → Environment Variables → Production
- **Or use:** `scripts/set-vercel-env.ps1` script

## 🔒 RECOMMENDED - Security Best Practice

### 4. SESSION_SECRET
- **Type:** Highly Recommended (security warning in production if missing)
- **Generate:** `openssl rand -base64 32`
- **Example:** `n8ptitsx2a41w6e5qzKt4v4yqT4PmuVam2WGC8dyr2U=`
- **Set in:** Vercel Dashboard → Environment Variables → Production

## ✅ OPTIONAL - Additional Features

These are optional but enable additional features:

### 5. OPENAI_API_KEY
- **Value:** `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`
- **Or use:** `scripts/set-vercel-env.ps1` script

### 6. DEEPSEEK_API_KEY
- **Value:** `sk-e67063c2b0434270ad78333f531fee7d`
- **Or use:** `scripts/set-vercel-env.ps1` script

### 7. STRIPE_SECRET_KEY
- **Value:** `sk_test_51RDRaOQx5TUeWOnWh7XgcYRoD2zYdZFa27svPuX3QpWpW6b8De6wbBDBRzf1MPx18I2ZxSFBxKb30lIfOGXR7b19000peRZKCe`
- **Or use:** `scripts/set-vercel-env.ps1` script

### 8. STRIPE_PUBLISHABLE_KEY
- **Value:** `pk_test_51RDRaOQx5TUeWOnWAkiLB4exPzJVaZW0jJ2drUUvStLDjuYgHCCL2bKKG3TsmN666TlcV2TbRWu9wGKZlBN83FWY00uPKMLpPx`
- **Or use:** `scripts/set-vercel-env.ps1` script

### 9. VITE_STRIPE_PUBLIC_KEY
- **Value:** `pk_test_51RDRaOQx5TUeWOnWAkiLB4exPzJVaZW0jJ2drUUvStLDjuYgHCCL2bKKG3TsmN666TlcV2TbRWu9wGKZlBN83FWY00uPKMLpPx`
- **Note:** Client-side variable (VITE_ prefix)
- **Or use:** `scripts/set-vercel-env.ps1` script

## 📝 Quick Setup Instructions

### Method 1: Vercel Dashboard (Recommended for DATABASE_URL and SESSION_SECRET)

1. Go to: https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables
2. Click "Add New"
3. Enter variable name and value
4. Select "Production" environment
5. Click "Save"
6. Repeat for each variable

### Method 2: PowerShell Script (For API keys)

Run the provided script:
```powershell
.\scripts\set-vercel-env.ps1
```

This will set:
- ANTHROPIC_API_KEY
- ANTHROPIC_MODEL
- OPENAI_API_KEY
- DEEPSEEK_API_KEY
- STRIPE keys
- VITE_STRIPE_PUBLIC_KEY

**Note:** DATABASE_URL and SESSION_SECRET must be set manually via dashboard.

### Method 3: Vercel CLI

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login
vercel login

# Set variables one by one
echo "value" | vercel env add VARIABLE_NAME production
```

## ✅ Verification

After setting variables:

1. **Verify in Dashboard:**
   - Go to Environment Variables page
   - Filter by "Production"
   - Verify all critical variables are listed

2. **Run Verification Script:**
   ```bash
   node scripts/verify-env.js
   ```
   (Note: This checks local .env file, not Vercel)

3. **Redeploy:**
   - Vercel Dashboard → Deployments → Latest → "Redeploy"
   - Or push a new commit to trigger deployment

4. **Check Runtime Logs:**
   - Deployment → Runtime Logs
   - Should see: "Application fully initialized"
   - No errors about missing environment variables

## 🔗 Useful Links

- Vercel Environment Variables: https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables
- Deployment Logs: https://vercel.com/metinbahdats-projects/learn-connect/deployments
- Neon Database: https://console.neon.tech/ (for DATABASE_URL)

