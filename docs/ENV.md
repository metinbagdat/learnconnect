# Environment Variables Documentation

This document lists all environment variables required for the LearnConnect application.

To set up your environment:
1. Copy this list to a `.env` file in the project root
2. Fill in the actual values for each variable
3. Never commit the `.env` file to version control

## Required Variables

### Core Configuration

- **DATABASE_URL** (Required for production)
  - Description: Neon PostgreSQL connection string
  - Format: `postgresql://user:password@host/database?sslmode=require`
  - Example: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`
  - Required: Yes (for production)

- **SESSION_SECRET** (Required for production)
  - Description: Secret key used to encrypt session cookies
  - How to generate: `openssl rand -base64 32`
  - Example: `n8ptitsx2a41w6e5qzKt4v4yqT4PmuVam2WGC8dyr2U=`
  - Required: Yes (for production)

- **NODE_ENV**
  - Description: Node.js environment
  - Options: `development`, `production`, `test`
  - Default: `development`
  - Required: No (defaults to development)

## Optional Variables

### AI Features

- **OPENAI_API_KEY**
  - Description: OpenAI API key for AI features
  - Get from: https://platform.openai.com/api-keys
  - Required: No (AI features will be disabled if not set)

- **ANTHROPIC_API_KEY**
  - Description: Anthropic API key for AI features
  - Get from: https://console.anthropic.com/settings/keys
  - Required: No (AI features will be disabled if not set)

### Payment Processing

- **STRIPE_SECRET_KEY**
  - Description: Stripe secret key for payment processing
  - Get from: https://dashboard.stripe.com/apikeys
  - Required: No (payment features will use demo mode if not set)

- **STRIPE_PUBLISHABLE_KEY**
  - Description: Stripe publishable key for frontend payment forms
  - Get from: https://dashboard.stripe.com/apikeys
  - Required: No

- **WEBHOOK_SECRET**
  - Description: Stripe webhook secret for webhook verification
  - Get from: Stripe Dashboard → Webhooks
  - Required: No

- **PAYPAL_CLIENT_ID**
  - Description: PayPal client ID for PayPal payments
  - Get from: https://developer.paypal.com/dashboard/applications/sandbox
  - Required: No (PayPal features will be disabled if not set)

- **PAYPAL_CLIENT_SECRET**
  - Description: PayPal client secret for PayPal payments
  - Get from: https://developer.paypal.com/dashboard/applications/sandbox
  - Required: No (PayPal features will be disabled if not set)

### Development & Debugging

- **ENABLE_DEBUG**
  - Description: Enable additional debug logging
  - Options: `true`, `false`
  - Default: `false`
  - Required: No

- **REPL_ID**
  - Description: Replit deployment ID (only for Replit deployments)
  - Required: No

## Example .env File

```bash
# Core Configuration
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
SESSION_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32
NODE_ENV=development

# AI Features (Optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Payment Processing (Optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Development
ENABLE_DEBUG=false
```

## Vercel Deployment

When deploying to Vercel, set these environment variables in:
- Vercel Dashboard → Project Settings → Environment Variables

**Critical for Production:**
- `DATABASE_URL` (Production environment)
- `SESSION_SECRET` (Production environment)

**Optional but Recommended:**
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`

