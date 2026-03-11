# 🚨 Deployment Fix Guide - eğitim.today

## Critical Issues Identified

### 1. Missing Environment Variables (CRITICAL)

The server **WILL FAIL TO START** without these variables:

- ❌ **DATABASE_URL** - Required by `server/db.ts`
- ❌ **ANTHROPIC_API_KEY** - Required by `server/ai/ai-reasoning.engine.ts`
- ❌ **ANTHROPIC_MODEL** - Required by `server/ai/ai-reasoning.engine.ts`

### 2. Recommended Variables (Security)

- ⚠️ **SESSION_SECRET** - Recommended for production security

## Immediate Action Required

### Step 1: Set Critical Environment Variables in Vercel

**Go to:** https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables

**Set these variables for Production environment:**

#### Priority 1: CRITICAL (Server won't start without these)

```bash
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
ANTHROPIC_API_KEY=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
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
SESSION_SECRET=<generate-with-openssl-rand-base64-32>
```

#### Priority 2: Optional (Recommended)

```bash
OPENAI_API_KEY=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
DEEPSEEK_API_KEY=sk-e67063c2b0434270ad78333f531fee7d
STRIPE_SECRET_KEY=sk_test_51RDRaOQx5TUeWOnWh7XgcYRoD2zYdZFa27svPuX3QpWpW6b8De6wbBDBRzf1MPx18I2ZxSFBxKb30lIfOGXR7b19000peRZKCe
STRIPE_PUBLISHABLE_KEY=pk_test_51RDRaOQx5TUeWOnWAkiLB4exPzJVaZW0jJ2drUUvStLDjuYgHCCL2bKKG3TsmN666TlcV2TbRWu9wGKZlBN83FWY00uPKMLpPx
VITE_STRIPE_PUBLIC_KEY=pk_test_51RDRaOQx5TUeWOnWAkiLB4exPzJVaZW0jJ2drUUvStLDjuYgHCCL2bKKG3TsmN666TlcV2TbRWu9wGKZlBN83FWY00uPKMLpPx
```

### Step 2: Verify Domain Configuration

1. **Check Vercel Domain Settings:**
   - Go to: Project Settings → Domains
   - Verify `eğitim.today` is listed
   - Check SSL certificate status (should be "Valid")

2. **Check DNS Records:**
   - In your domain registrar (where you bought eğitim.today)
   - Verify CNAME or A records point to Vercel
   - CNAME: `@` → `cname.vercel-dns.com`
   - Or A records: `@` → Vercel IP addresses

3. **Test DNS Propagation:**
   ```bash
   nslookup eğitim.today
   # or
   dig eğitim.today
   ```

### Step 3: Redeploy After Setting Variables

After setting environment variables:

1. **Option A: Manual Redeploy**
   - Vercel Dashboard → Deployments
   - Click "..." on latest deployment
   - Click "Redeploy"

2. **Option B: Trigger New Deployment**
   - Make a small change and push to Git
   - Or use: `vercel --prod`

### Step 4: Verify Deployment

1. **Check Build Logs:**
   - Vercel Dashboard → Latest Deployment → Logs
   - Should show: "Build successful"

2. **Check Runtime Logs:**
   - Vercel Dashboard → Latest Deployment → Runtime Logs
   - Should show: "Application fully initialized"
   - No errors about missing environment variables

3. **Test Endpoints:**
   ```bash
   # Test health endpoint
   curl https://learn-connect-*.vercel.app/api/health
   # Expected: {"status":"ok","timestamp":"..."}
   
   # Test custom domain (after DNS propagation)
   curl https://eğitim.today/api/health
   # Expected: {"status":"ok","timestamp":"..."}
   ```

## Troubleshooting

### Issue: Server fails to start

**Symptom:** Runtime logs show error about missing environment variable

**Solution:**
1. Verify variable is set in Vercel (Production environment)
2. Check variable name matches exactly (case-sensitive)
3. Ensure no trailing spaces
4. Redeploy after setting variable

### Issue: Domain not working but *.vercel.app works

**Symptom:** `https://learn-connect-*.vercel.app` works but `https://eğitim.today` doesn't

**Solution:**
1. DNS propagation issue - wait 5 minutes to 48 hours
2. Check DNS records in domain registrar
3. Verify domain is added in Vercel
4. Check SSL certificate status

### Issue: Build succeeds but runtime fails

**Symptom:** Build logs show success but runtime logs show errors

**Solution:**
1. Check runtime logs for specific error
2. Verify environment variables are set (build-time vs runtime)
3. Check for missing dependencies
4. Verify file paths in imports

## Quick Checklist

- [ ] DATABASE_URL set in Vercel (Production)
- [ ] ANTHROPIC_API_KEY set in Vercel (Production)
- [ ] ANTHROPIC_MODEL set in Vercel (Production)
- [ ] SESSION_SECRET set in Vercel (Production)
- [ ] Domain eğitim.today added in Vercel
- [ ] DNS records configured correctly
- [ ] SSL certificate valid
- [ ] Deployment redeployed after setting variables
- [ ] Build logs show success
- [ ] Runtime logs show "Application fully initialized"
- [ ] Health endpoint returns 200 OK

## Emergency Rollback

If deployment breaks production:

1. **Promote Previous Deployment:**
   - Vercel Dashboard → Deployments
   - Find last working deployment
   - Click "..." → "Promote to Production"

2. **Or Revert Git Commit:**
   ```bash
   git revert HEAD
   git push origin main
   ```

## Support Resources

- Vercel Dashboard: https://vercel.com/metinbahdats-projects/learn-connect
- Environment Variables: https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables
- Deployment Logs: https://vercel.com/metinbahdats-projects/learn-connect/deployments
- Vercel Support: https://vercel.com/help

