# Quick Reference: Getting API Keys and Credentials

## FIREBASE (Frontend)
**Where**: https://console.firebase.google.com  
**Time**: 10 minutes  
**Cost**: Free tier available  
**What to get**: 6 values from Project Settings → Web app

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

**Steps**:
1. Create project
2. Add Web app
3. Copy config values
4. Create Firestore database (test mode)
5. Enable Authentication (Email/Password)

---

## DATABASE (Backend)

### Option A: Neon (Recommended)
**Where**: https://neon.tech  
**Time**: 5 minutes  
**Cost**: Free tier generous  
**What to get**: Connection string

```
DATABASE_URL=postgresql://user:password@ep-xxx.region.neon.tech/db?sslmode=require
```

### Option B: Local PostgreSQL
**Where**: Install locally  
**Time**: 10 minutes  
**Cost**: Free  
**What to get**: Connection string

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/learnconnect_dev?sslmode=disable
```

**Pick ONE** (Neon recommended for easy setup)

---

## AI SERVICES

### OpenAI
**Where**: https://platform.openai.com/api-keys  
**Time**: 3 minutes  
**Cost**: ~$0.002-0.01 per request  
**What to get**: API key starts with `sk-`

```
OPENAI_API_KEY=sk-...
```

**Need**: Create account, verify phone/email

### Anthropic (Claude)
**Where**: https://console.anthropic.com/settings/keys  
**Time**: 3 minutes  
**Cost**: ~$0.003-0.015 per request  
**What to get**: API key starts with `sk-ant-`

```
ANTHROPIC_API_KEY=sk-ant-...
```

**Need**: Create account, add billing

### OpenRouter (Optional - Use multiple AI models)
**Where**: https://openrouter.ai  
**Time**: 3 minutes  
**Cost**: Pay-as-you-go  
**What to get**: API key

```
AI_INTEGRATIONS_OPENROUTER_API_KEY=...
```

**Pick at least ONE** (OpenAI or Anthropic)

---

## UPDATING .env.local

### Method 1: Use Setup Script (Easiest)
```powershell
# In project directory
.\setup-env.ps1
```
Follow prompts, enter credentials

### Method 2: Manual Edit
```powershell
# Open in VS Code
code .\.env.local

# Or in Notepad
notepad .\.env.local

# Find and replace dummy values with real ones
```

---

## VERIFICATION

### After updating .env.local:

```bash
# Restart container
docker restart learnconnect-app

# Check logs (wait 10 seconds)
docker logs learnconnect-app --tail 30

# Visit http://localhost:5173
# Open DevTools (F12) → Console
# Should NOT see "Firebase: Error (auth/invalid-api-key)"
```

---

## TIME ESTIMATE
- Firebase: 10 min
- Database: 5 min  
- AI Services: 10 min
- Update .env.local: 5 min
- **Total: 30 minutes**

---

## COST ESTIMATE (Monthly)
- Firebase: $0-25 (free tier covers most dev)
- Database: $0 (Neon free tier)
- OpenAI: $5-50 (depending on usage)
- Anthropic: $5-50 (depending on usage)
- **Total: $10-125** (very affordable)

---

## SUPPORT LINKS
- Firebase Docs: https://firebase.google.com/docs
- Neon Docs: https://neon.tech/docs/introduction
- OpenAI Docs: https://platform.openai.com/docs/introduction
- Anthropic Docs: https://docs.anthropic.com/en/api/getting-started
- OpenRouter Docs: https://openrouter.ai/docs

