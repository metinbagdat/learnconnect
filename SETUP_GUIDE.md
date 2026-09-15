# LearnConnect - Complete Setup Guide
## Firebase, Database, and AI Services Configuration

---

## 1. FIREBASE SETUP (Frontend - 15 minutes)

### Step 1.1: Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project" or select existing project
3. Enter project name: `learnconnect-dev` (for development)
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 1.2: Create Web App
1. In Firebase Console, click the web icon `</>`
2. Register app name: `LearnConnect Web`
3. Check "Also set up Firebase Hosting"
4. Click "Register app"

### Step 1.3: Copy Firebase Config
You'll see a config object like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "learnconnect-dev.firebaseapp.com",
  projectId: "learnconnect-dev",
  storageBucket: "learnconnect-dev.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  measurementId: "G-ABCDEF1234"
};
```

### Step 1.4: Enable Authentication
1. Go to Firebase Console → Authentication
2. Click "Get started"
3. Enable sign-in methods:
   - **Email/Password** (required)
   - Google (recommended)
   - GitHub (optional)
4. Save

### Step 1.5: Create Firestore Database
1. Go to Firebase Console → Firestore Database
2. Click "Create database"
3. Choose: **Start in test mode** (for development)
4. Select region closest to you
5. Click "Create"

### Step 1.6: Set Firestore Rules
1. Go to Firestore → Rules tab
2. Replace default rules with:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
3. Click "Publish"

**⏸️ PAUSE HERE** - Copy your Firebase credentials to .env.local in next step

---

## 2. DATABASE SETUP (Backend - 20 minutes)

### Option A: Neon (Recommended - Free PostgreSQL)

#### Step 2A.1: Create Neon Account
1. Go to https://neon.tech
2. Sign up with GitHub (recommended)
3. Create a new project: `learnconnect-dev`
4. Select region closest to you
5. Click "Create project"

#### Step 2A.2: Get Connection String
1. In Neon Console, go to "Connection string"
2. Select "Node.js" from dropdown
3. Copy the full connection string:
```
postgresql://user:password@ep-xxx.region.neon.tech/learnconnect_dev?sslmode=require
```

#### Step 2A.3: Initialize Database
You can run migrations later, for now just save the connection string.

### Option B: Local PostgreSQL

#### Step 2B.1: Install PostgreSQL
- Windows: https://www.postgresql.org/download/windows/
- macOS: `brew install postgresql`
- Linux: `sudo apt install postgresql`

#### Step 2B.2: Create Database
```bash
createdb learnconnect_dev
```

#### Step 2B.3: Get Connection String
```
postgresql://postgres:password@localhost:5432/learnconnect_dev?sslmode=disable
```

**Choose Option A or B** - You'll use one connection string in .env.local

---

## 3. AI SERVICES SETUP (20 minutes total)

### 3.1: OpenAI Setup (5 minutes)

1. Go to https://platform.openai.com/api-keys
2. Log in or create account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. **Save it securely** - you won't see it again

**Cost**: Pay-as-you-go (~$0.002 per request)

### 3.2: Anthropic Setup (5 minutes)

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Go to Settings → API keys
4. Click "Create key"
5. Copy the key (starts with `sk-ant-`)
6. **Save it securely**

**Cost**: Pay-as-you-go (~$0.003 per request)

### 3.3: Optional - OpenRouter (Hybrid)

OpenRouter lets you use multiple AI models through one API:

1. Go to https://openrouter.ai
2. Sign up
3. Go to Settings → Keys
4. Generate API key
5. Copy the key

**Benefit**: Use GPT, Claude, Llama, etc. through one interface

---

## 4. UPDATE .env.local (5 minutes)

Now that you have all credentials, update your `.env.local` file:

```bash
# Navigate to your project
cd C:\Users\mb\Desktop\LearnConnect\learnconnect-

# Open .env.local in your editor and update:
```

### Firebase Section (from Step 1.3)
```
VITE_FIREBASE_API_KEY=AIzaSyD_your_actual_key_here
VITE_FIREBASE_AUTH_DOMAIN=learnconnect-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=learnconnect-dev
VITE_FIREBASE_STORAGE_BUCKET=learnconnect-dev.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-ABCDEF1234
```

### Database Section (from Step 2)
```
# If using Neon:
DATABASE_URL=postgresql://user:password@ep-xxx.region.neon.tech/learnconnect_dev?sslmode=require

# If using local PostgreSQL:
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/learnconnect_dev?sslmode=disable
```

### AI Services Section
```
OPENAI_API_KEY=sk-your_openai_key_here
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here
AI_INTEGRATIONS_OPENROUTER_API_KEY=your_openrouter_key_here (optional)
```

---

## 5. VERIFICATION (10 minutes)

### 5.1: Verify .env.local is Loaded
```bash
# Check file exists
cat C:\Users\mb\Desktop\LearnConnect\learnconnect-\.env.local

# Should show your credentials (not dummy values)
```

### 5.2: Test Firebase in Browser
1. Go to http://localhost:5173
2. Open DevTools (F12)
3. Go to Console tab
4. If you see Firebase errors about invalid API key, Firebase isn't configured
5. If no Firebase errors, **Firebase is configured!** ✅

### 5.3: Test Backend Connectivity
Once backend is running on port 5000:
```bash
curl http://localhost:5000/health
```
Should return: `{"status":"ok"}`

### 5.4: Test AI Services (Optional)
Create a test file to verify API keys work:
```javascript
// test-ai.js
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Test OpenAI
openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [{ role: "user", content: "Test" }]
}).then(r => console.log("OpenAI: OK")).catch(e => console.error("OpenAI:", e.message));

// Test Anthropic
anthropic.messages.create({
  model: "claude-3-sonnet-20240229",
  max_tokens: 100,
  messages: [{ role: "user", content: "Test" }]
}).then(r => console.log("Anthropic: OK")).catch(e => console.error("Anthropic:", e.message));
```

---

## 6. RESTART CONTAINER

After updating .env.local:

```bash
# Restart the container to load new environment variables
docker restart learnconnect-app

# Check logs
docker logs learnconnect-app --tail 20
```

Should show:
```
VITE v5.4.21 ready in XXX ms
✓ Firebase initialized
✓ Database connected
```

---

## SUMMARY CHECKLIST

- [ ] Firebase project created and Web app registered
- [ ] Firebase credentials copied to .env.local
- [ ] Firestore database created with rules deployed
- [ ] Database connection string added to .env.local (Neon or local PostgreSQL)
- [ ] OpenAI API key added to .env.local
- [ ] Anthropic API key added to .env.local
- [ ] .env.local file saved and updated
- [ ] Container restarted
- [ ] Firebase verified in browser console (no invalid-api-key errors)
- [ ] Backend server running on port 5000 (optional but recommended)

---

## TROUBLESHOOTING

### Firebase: "auth/invalid-api-key"
- Check .env.local has correct API key
- Make sure file is in project root: `C:\Users\mb\Desktop\LearnConnect\learnconnect-\.env.local`
- Restart container: `docker restart learnconnect-app`

### Database Connection Failed
- If using Neon: Check connection string includes `sslmode=require`
- If local PostgreSQL: Verify database exists: `psql -l`
- Test connection: `psql <connection_string>`

### AI API Errors
- "Invalid API key": Check key is copied correctly (no spaces)
- "Quota exceeded": You may need to add billing to OpenAI account
- "Rate limited": Wait a few seconds before retrying

---

## NEXT STEPS

1. **Complete the setup above** (40 minutes)
2. **Restart container** with new .env.local
3. **Test the app** at http://localhost:5173
4. **Start building features** with AI and database support

For questions, refer to:
- Firebase: https://firebase.google.com/docs
- Neon: https://neon.tech/docs
- OpenAI: https://platform.openai.com/docs
- Anthropic: https://docs.anthropic.com

---

