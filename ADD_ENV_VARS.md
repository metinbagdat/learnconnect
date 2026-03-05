<<<<<<< Current (Your changes)
=======
# Add Environment Variables in Vercel Dashboard

## Current Status
✅ **DATABASE_URL** - Already set (Production)  
✅ **SESSION_SECRET** - Already set (Production)  
⚠️ **AI API Keys** - Need to be added
⚠️ **Firebase (VITE_FIREBASE_*)** - Need to be added

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

## Steps to Add Firebase Frontend Config

1. **Open Firebase Console:**
   https://console.firebase.google.com

2. **Copy Web App Config:**
   - Project Settings → General → "Your apps" → Web app
   - Copy the config values (apiKey, authDomain, projectId, etc.)

3. **Add the following Vercel env vars (all prefixed with `VITE_`):**
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID` (optional)

4. **Environment:** Select **Production** (and Preview if needed)

5. **Redeploy:**
   - Go to: https://vercel.com/metinbahdats-projects/learn-connect/deployments
   - Click "Redeploy" on the latest deployment
   - OR wait for automatic deployment from GitHub push

## After Adding Variables

The deployment will automatically trigger, or you can manually redeploy from the dashboard.

Your app will be available at:
- **Production**: https://learn-connect.vercel.app (or your custom domain)

>>>>>>> Incoming (Background Agent changes)
