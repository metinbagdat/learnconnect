# Add Environment Variables in Vercel Dashboard

## Current Status
✅ **DATABASE_URL** - Already set (Production)  
✅ **SESSION_SECRET** - Already set (Production)  
⚠️ **AI API Keys** - Need to be added

## Steps to Add AI API Keys

1. **Open Vercel Dashboard:**
   https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables

2. **Add OPENAI_API_KEY:**
   - Click "Add New"
   - Key: `OPENAI_API_KEY`
   - Value: Your OpenAI API key (from https://platform.openai.com/api-keys)
   - Environment: Select **Production** ✅
   - Click "Save"

3. **Add ANTHROPIC_API_KEY:**
   - Click "Add New"
   - Key: `ANTHROPIC_API_KEY`
   - Value: Your Anthropic API key (from https://console.anthropic.com/)
   - Environment: Select **Production** ✅
   - Click "Save"

4. **Redeploy:**
   - Go to: https://vercel.com/metinbahdats-projects/learn-connect/deployments
   - Click "Redeploy" on the latest deployment
   - OR wait for automatic deployment from GitHub push

## After Adding Variables

The deployment will automatically trigger, or you can manually redeploy from the dashboard.

Your app will be available at:
- **Production**: https://learn-connect.vercel.app (or your custom domain)

