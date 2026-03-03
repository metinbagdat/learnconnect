# Quick Deploy to Vercel - Step by Step

## ✅ Project Status
- ✅ Vercel CLI installed and logged in
- ✅ Project linked: `metinbahdats-projects/learn-connect`
- ✅ SESSION_SECRET generated: `n8ptitsx2a41w6e5qzKt4v4yqT4PmuVam2WGC8dyr2U=`

## 🚀 Deploy Now (2 Options)

### Option 1: Vercel Dashboard (Easiest - Recommended)

1. **Open Vercel Dashboard:**
   https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables

2. **Add Environment Variables:**
   Click "Add New" for each variable:

   | Variable Name | Value | Environment |
   |--------------|-------|-------------|
   | `SESSION_SECRET` | `n8ptitsx2a41w6e5qzKt4v4yqT4PmuVam2WGC8dyr2U=` | Production ✅ |
   | `DATABASE_URL` | Your Neon PostgreSQL connection string | Production ✅ |
   | `OPENAI_API_KEY` | Your OpenAI API key (optional) | Production ✅ |
   | `ANTHROPIC_API_KEY` | Your Anthropic API key (optional) | Production ✅ |

3. **Deploy:**
   - Go to: https://vercel.com/metinbahdats-projects/learn-connect/deployments
   - Click "Redeploy" on the latest deployment
   - OR push to GitHub to trigger auto-deploy

### Option 2: Vercel CLI

Run these commands one by one (you'll be prompted for values):

```powershell
cd "C:\Users\mb\Desktop\LearnConnect\LearnConnect"

# 1. Set SESSION_SECRET
echo "n8ptitsx2a41w6e5qzKt4v4yqT4PmuVam2WGC8dyr2U=" | vercel env add SESSION_SECRET production
# When asked "Mark as sensitive?", type: y

# 2. Set DATABASE_URL (you need to provide this)
vercel env add DATABASE_URL production
# Paste your Neon database connection string when prompted
# When asked "Mark as sensitive?", type: y

# 3. Set OPENAI_API_KEY (optional)
vercel env add OPENAI_API_KEY production
# Paste your OpenAI API key when prompted, or press Ctrl+C to skip
# When asked "Mark as sensitive?", type: y

# 4. Set ANTHROPIC_API_KEY (optional)
vercel env add ANTHROPIC_API_KEY production
# Paste your Anthropic API key when prompted, or press Ctrl+C to skip
# When asked "Mark as sensitive?", type: y

# 5. Deploy to production
vercel --prod
```

## 📋 What You Need

### Required:
- ✅ **SESSION_SECRET**: Already generated above
- ⚠️ **DATABASE_URL**: Your Neon PostgreSQL connection string
  - Get it from: https://console.neon.tech/
  - Format: `postgresql://user:password@host/database?sslmode=require`

### Optional (for AI Features):
- **OPENAI_API_KEY**: Get from https://platform.openai.com/api-keys
- **ANTHROPIC_API_KEY**: Get from https://console.anthropic.com/

## 🎯 After Deployment

Your app will be available at:
- **Production URL**: https://learn-connect.vercel.app (or your custom domain)

Test endpoints:
- Health check: https://learn-connect.vercel.app/api/health
- Frontend: https://learn-connect.vercel.app

## ⚡ Quick Start (If you have DATABASE_URL ready)

If you have your DATABASE_URL, run this single command to open the dashboard:

```powershell
Start-Process "https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables"
```

Then add the variables and deploy!

