# Environment Variables Documentation

This document lists all required and optional environment variables for the LearnConnect application.

## Required Variables

### Frontend (Vite/React)

These variables must be prefixed with `VITE_` to be accessible in the browser.

| Variable | Description | Example | Where to Get |
|----------|-------------|---------|--------------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | `AIzaSyA...` | Firebase Console > Project Settings > General |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain | `learnconnect.firebaseapp.com` | Firebase Console > Project Settings > General |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `learnconnect-project` | Firebase Console > Project Settings > General |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket | `learnconnect.appspot.com` | Firebase Console > Project Settings > General |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | `123456789012` | Firebase Console > Project Settings > General |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | `1:123456789012:web:abcdef` | Firebase Console > Project Settings > General |
| `VITE_FIREBASE_MEASUREMENT_ID` | Google Analytics ID (optional) | `G-XXXXXXXXXX` | Firebase Console > Project Settings > General |

#### ✅ Firebase değerleri nasıl alınır?
1. [Firebase Console](https://console.firebase.google.com) → Projeni seç.
2. **Project Settings** → **General** → **Your apps** bölümünde Web app'i seç (yoksa oluştur).
3. **SDK setup and configuration** kutusundaki değerleri kopyala:
   - apiKey → `VITE_FIREBASE_API_KEY`
   - authDomain → `VITE_FIREBASE_AUTH_DOMAIN`
   - projectId → `VITE_FIREBASE_PROJECT_ID`
   - storageBucket → `VITE_FIREBASE_STORAGE_BUCKET`
   - messagingSenderId → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - appId → `VITE_FIREBASE_APP_ID`
   - measurementId → `VITE_FIREBASE_MEASUREMENT_ID` (opsiyonel)

### Backend (Server)

| Variable | Description | Example | Where to Get |
|----------|-------------|---------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` | Database provider (Neon, Supabase, etc.) |
| `SESSION_SECRET` | Secret for session encryption | Random 32+ character string | Generate with: `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | `sk-ant-...` | https://console.anthropic.com/settings/keys |
| `ANTHROPIC_MODEL` | Anthropic model name | `claude-3-5-sonnet-20241022` | Anthropic documentation |
| `NODE_ENV` | Node environment | `production` or `development` | Set based on environment |

#### ✅ DATABASE_URL nasıl alınır? (Neon)
1. [Neon Console](https://console.neon.tech) → Projeni seç.
2. **Connection Details** bölümünden **connection string** kopyala.
3. `DATABASE_URL` olarak yapıştır.

#### ✅ SESSION_SECRET nasıl üretilir?
Her ortam için farklı, güçlü bir secret önerilir.
- **Linux/macOS:**
  ```bash
  openssl rand -base64 32
  ```
- **Windows (PowerShell):**
  ```powershell
  [Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256}))
  ```

## Optional Variables

### AI Services

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key (if using OpenAI) | `sk-...` |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Alternative OpenAI key | `sk-...` |
| `AI_INTEGRATIONS_OPENROUTER_API_KEY` | OpenRouter API key | `sk-or-...` |
| `AI_AYT_MODEL` | Model for AYT curriculum generation | `gpt-4o-mini` |

### Payment Processing

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` |
| `PAYPAL_CLIENT_ID` | PayPal client ID | `...` |
| `PAYPAL_CLIENT_SECRET` | PayPal client secret | `...` |

### Application Settings

| Variable | Description | Example |
|----------|-------------|---------|
| `SITE_URL` | Site URL for sitemap | `https://learnconnect.net` |
| `ENABLE_DEBUG` | Enable debug mode | `true` or `false` |
| `REPL_ID` | Replit deployment ID (if using Replit) | `...` |

### Firebase Admin SDK (Server-side scripts)

| Variable | Description | Example |
|----------|-------------|---------|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Path to service account JSON | `./service-account-key.json` |

## Setting Environment Variables

### Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in all required variables in `.env.local`

3. Restart development server:
   ```bash
   npm run dev
   ```

### Vercel Deployment

1. Go to Vercel Dashboard: https://vercel.com/dashboard

2. Select your project

3. Navigate to **Settings** > **Environment Variables**

4. Add each variable:
   - **Key**: Variable name (e.g., `VITE_FIREBASE_API_KEY`)
   - **Value**: Variable value
   - **Environment**: Select which environments (Production, Preview, Development)

5. Click **Save**

6. Redeploy application for changes to take effect

### Environment-Specific Values

You can set different values for different environments:

- **Production**: Live production environment
- **Preview**: Preview deployments (pull requests, branches)
- **Development**: Local development (if using Vercel CLI)

## Security Best Practices

1. **Never commit `.env.local` or `.env` files** to version control
2. **Use strong, random values** for secrets (SESSION_SECRET, etc.)
3. **Rotate secrets regularly**, especially if exposed
4. **Use different keys** for development and production
5. **Limit access** to environment variables in team settings
6. **Use Vercel's environment variable encryption** for sensitive data

## Verification

After setting environment variables, verify they're loaded:

### Frontend (Browser Console)
```javascript
console.log(import.meta.env.VITE_FIREBASE_PROJECT_ID);
```

### Backend (Server Logs)
```javascript
console.log(process.env.DATABASE_URL ? 'Database URL set' : 'Database URL missing');
```

## Troubleshooting

### Variables not loading in frontend
- Ensure variables are prefixed with `VITE_`
- Restart development server
- Clear browser cache

### Variables not loading in backend
- Check `.env.local` file exists
- Verify variable names match exactly
- Restart server

### Vercel deployment issues
- Verify variables set in Vercel dashboard
- Check environment (Production/Preview) matches
- Redeploy after adding variables

## Quick Setup Checklist

- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in Firebase configuration variables
- [ ] Set `DATABASE_URL` for PostgreSQL
- [ ] Generate and set `SESSION_SECRET`
- [ ] Set `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL`
- [ ] Set `NODE_ENV=development` for local
- [ ] Add all variables to Vercel dashboard
- [ ] Verify variables loaded correctly
- [ ] Test application functionality
