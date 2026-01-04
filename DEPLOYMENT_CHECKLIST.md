# 🚀 Deployment Checklist - AI Pipeline Optimization

## ✅ Pre-Deployment Checklist

### 1. Environment Variables in Vercel

**Go to:** https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables

**Required Variables (Production):**

#### Core Configuration
- [ ] `DATABASE_URL` - Neon PostgreSQL connection string (pooler)
- [ ] `SESSION_SECRET` - Session encryption key
- [ ] `NODE_ENV=production`

#### AI Configuration
- [x] `ANTHROPIC_API_KEY` - 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
- [x] `ANTHROPIC_MODEL` - claude-3-5-sonnet-20241022
- [x] `OPENAI_API_KEY` - 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
- [ ] `DEEPSEEK_API_KEY` - sk-e67063c2b0434270ad78333f531fee7d

#### Payment Processing
- [x] `STRIPE_SECRET_KEY` - sk_test_51RDRaOQx5TUeWOnWh7XgcYRoD2zYdZFa27svPuX3QpWpW6b8De6wbBDBRzf1MPx18I2ZxSFBxKb30lIfOGXR7b19000peRZKCe
- [x] `STRIPE_PUBLISHABLE_KEY` - pk_test_51RDRaOQx5TUeWOnWAkiLB4exPzJVaZW0jJ2drUUvStLDjuYgHCCL2bKKG3TsmN666TlcV2TbRWu9wGKZlBN83FWY00uPKMLpPx

#### Client-Side Variables (Vite)
- [x] `VITE_STRIPE_PUBLIC_KEY` - pk_test_51RDRaOQx5TUeWOnWAkiLB4exPzJVaZW0jJ2drUUvStLDjuYgHCCL2bKKG3TsmN666TlcV2TbRWu9wGKZlBN83FWY00uPKMLpPx

### 2. Build Verification

- [x] Build successful (`npm run build`)
- [x] No linter errors
- [x] Bundle size optimized
- [x] Anthropic SDK excluded from client bundle

### 3. Security Features

- [x] Authentication middleware on AI routes
- [x] Input validation (Zod schema)
- [x] Rate limiting (10 req/min)
- [x] Request size limit (100KB)
- [x] Timeout protection (30s)
- [x] Error sanitization

## 🚀 Deployment Steps

### Option 1: Git Push (Automatic Deploy)

```bash
git push origin main
```

Vercel will automatically:
- Detect the push
- Build the project
- Deploy to production

### Option 2: Vercel CLI

```bash
vercel --prod
```

### Option 3: Manual Redeploy

1. Go to: https://vercel.com/metinbahdats-projects/learn-connect/deployments
2. Click "..." on latest deployment
3. Click "Redeploy"

## ✅ Post-Deployment Verification

### 1. Health Check
Visit: https://eğitim.today/api/health
Expected: `{"status":"ok","timestamp":"..."}`

### 2. AI Endpoint Test
```bash
# Test authentication requirement
curl https://eğitim.today/api/ai/adaptive-plan
# Should return: 401 Unauthorized

# Test with authentication (after login)
# Should return: 200 OK with plan data
```

### 3. Frontend Check
Visit: https://eğitim.today/
- [ ] Page loads correctly
- [ ] No console errors
- [ ] AI features accessible (after login)

## 📝 Notes

- All environment variables must be set in Vercel Dashboard
- `.env` file is NOT committed (in .gitignore)
- Production build optimizations are active
- Security features are enabled
