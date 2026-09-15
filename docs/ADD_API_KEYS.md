# Add API Keys to Vercel and GitHub

## ⚠️ IMPORTANT SECURITY WARNING
**These keys were shared in chat. Consider rotating them for security.**

## Vercel Environment Variables

Add these to: https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables

### Required:
1. **DATABASE_URL** - Your Neon PostgreSQL connection string (required)
2. **SESSION_SECRET** - `n8ptitsx2a41w6e5qzKt4v4yqT4PmuVam2WGC8dyr2U=` (required)

### Optional (but recommended):
3. **ANTHROPIC_API_KEY** - `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`
4. **OPENAI_API_KEY** - `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`
5. **DEEPSEEK_API_KEY** - `sk-e67063c2b0434270ad78333f531fee7d`
6. **STRIPE_SECRET_KEY** - `sk_test_51RDRaOQx5TUeWOnWh7XgcYRoD2zYdZFa27svPuX3QpWpW6b8De6wbBDBRzf1MPx18I2ZxSFBxKb30lIfOGXR7b19000peRZKCe`
7. **STRIPE_PUBLISHABLE_KEY** (for frontend) - `pk_test_51RDRaOQx5TUeWOnWAkiLB4exPzJVaZW0jJ2drUUvStLDjuYgHCCL2bKKG3TsmN666TlcV2TbRWu9wGKZlBN83FWY00uPKMLpPx`

**For each variable:**
- Click "Add New"
- Paste the value
- Select **Production** environment
- Mark as sensitive if prompted
- Save

## GitHub Actions Secrets/Variables

Add to: https://github.com/metinbagdat/learnconnect-/settings/secrets/actions

### Required for GitHub Actions:
1. **NEON_API_KEY** (Secret) - Get from https://console.neon.tech/ → Account Settings → Developer Settings
2. **NEON_PROJECT_ID** (Variable) - Get from https://console.neon.tech/ → Your Project → Settings → General

**Note:** The API keys above (ANTHROPIC, OPENAI, etc.) are NOT needed for GitHub Actions workflow. Only NEON_API_KEY and NEON_PROJECT_ID are required for the database migration workflow.

## After Adding

1. **Vercel**: Redeploy or wait for automatic deployment
2. **GitHub Actions**: The next PR will trigger the workflow with proper credentials

