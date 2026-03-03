# LearnConnect Deployment Guide

Complete guide for deploying LearnConnect to Vercel with Firestore integration.

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Firebase account and project created
- [ ] Vercel account
- [ ] PostgreSQL database (Neon, Supabase, etc.)
- [ ] Anthropic API key for AI features

## Step 1: Firestore Security Rules Deployment

### 1.1 Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 1.2 Login to Firebase

```bash
firebase login
```

### 1.3 Initialize Firebase (if not already done)

```bash
firebase init firestore
```

Select your Firebase project when prompted.

### 1.4 Deploy Rules

```bash
# Make script executable (Linux/Mac)
chmod +x scripts/deploy-firestore-rules.sh

# Run deployment script
./scripts/deploy-firestore-rules.sh

# Or manually:
firebase deploy --only firestore:rules
```

### 1.5 Verify Rules

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** > **Rules**
4. Verify rules are deployed correctly

## Step 2: Admin Setup

### 2.1 Create Admin User in PostgreSQL

The application uses PostgreSQL for authentication. Create admin user using the existing script:

```bash
# If using the create-admin script
ts-node server/create-admin.ts admin@learnconnect.com Admin123! "System Admin"
```

Or create manually via SQL/application.

### 2.2 Add Admin to Firestore

Firestore rules check `/admins/{uid}` collection. Add admin document:

```bash
# Download Firebase service account key:
# Firebase Console > Settings > Service Accounts > Generate New Private Key
# Save as: service-account-key.json

# Run setup script
ts-node scripts/setup-firestore-admin.ts <uid> <email> <displayName>

# Example:
ts-node scripts/setup-firestore-admin.ts abc123 admin@learnconnect.com "System Admin"
```

**Note**: You need the admin user's UID from PostgreSQL or Firebase Auth.

### 2.3 Test Admin Login

1. Start development server: `npm run dev`
2. Navigate to `/admin` or login page
3. Login with admin credentials
4. Verify admin dashboard loads
5. Verify admin can access protected routes

## Step 3: Seed Initial MEB Curriculum Data

### 3.1 Seed Firestore with Curriculum

```bash
# Ensure service-account-key.json exists
ts-node scripts/seed-firestore-curriculum.ts
```

This will seed:
- TYT subjects: Matematik, Türkçe, Fizik, Kimya
- AYT subjects: Matematik, Fizik, Kimya, Biyoloji
- Topics for each subject with MEB codes

### 3.2 Verify Data in Firestore

1. Go to Firebase Console
2. Navigate to **Firestore Database**
3. Check `curriculum/tyt/subjects` and `curriculum/ayt/subjects`
4. Verify subjects and topics are present

## Step 4: Test Admin Dashboard

Follow the test checklist in `scripts/test-admin-dashboard.md`:

```bash
# Review test checklist
cat scripts/test-admin-dashboard.md
```

Key tests:
- [ ] Admin login works
- [ ] CRUD operations work
- [ ] AI generation works
- [ ] Data saves to Firestore
- [ ] Non-admin access blocked

## Step 5: Configure Environment Variables

### 5.1 Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in all required variables (see `DEPLOYMENT_ENV_VARS.md`)

3. Required variables:
   - `VITE_FIREBASE_*` (all Firebase config)
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `ANTHROPIC_API_KEY`
   - `ANTHROPIC_MODEL`

### 5.2 Vercel Configuration

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (or create new)
3. Go to **Settings** > **Environment Variables**
4. Add all variables from `.env.local`:
   - Set for **Production**, **Preview**, and **Development**
   - Use same values or environment-specific values

See `DEPLOYMENT_ENV_VARS.md` for complete list.

## Step 6: Deploy to Vercel

### 6.1 Verify Vercel Configuration

Check `vercel.json` exists and is configured correctly:

```json
{
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

### 6.2 Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 6.3 Deploy via CLI

```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 6.4 Deploy via GitHub (Recommended)

1. Push code to GitHub repository
2. Go to Vercel Dashboard
3. Click **Add New Project**
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite (or detect automatically)
   - **Root Directory**: `.` (or your project root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist` (or your build output)
6. Add environment variables (Step 5.2)
7. Click **Deploy**

### 6.5 Verify Deployment

1. Check deployment status in Vercel dashboard
2. Visit deployed URL
3. Test admin login
4. Test key features
5. Check browser console for errors
6. Check Vercel function logs

## Step 7: Post-Deployment Verification

### 7.1 Smoke Tests

- [ ] Homepage loads
- [ ] Admin login works
- [ ] Admin dashboard accessible
- [ ] Curriculum data visible
- [ ] AI generation works
- [ ] Firestore writes succeed

### 7.2 Performance Check

- [ ] Page load time < 3 seconds
- [ ] API responses < 1 second
- [ ] No console errors
- [ ] No Firestore rule violations

### 7.3 Security Check

- [ ] Non-admin cannot access admin routes
- [ ] Firestore rules enforced
- [ ] Environment variables not exposed in frontend
- [ ] HTTPS enabled (Vercel default)

## Troubleshooting

### Firestore Rules Not Working

1. Verify rules deployed: `firebase deploy --only firestore:rules`
2. Check rules syntax in Firebase Console
3. Test in Rules Playground
4. Check admin document exists in `/admins/{uid}`

### Admin Cannot Login

1. Verify admin exists in PostgreSQL
2. Verify admin document in Firestore `/admins/{uid}`
3. Check session configuration
4. Check browser cookies/localStorage

### Environment Variables Not Loading

1. Verify variables set in Vercel dashboard
2. Check variable names match exactly
3. Ensure `VITE_` prefix for frontend variables
4. Redeploy after adding variables

### Build Failures

1. Check build logs in Vercel
2. Verify all dependencies in `package.json`
3. Check Node.js version (should be 18+)
4. Verify build command correct

### API Errors

1. Check Vercel function logs
2. Verify environment variables set
3. Check API routes registered correctly
4. Verify CORS configuration

## Maintenance

### Updating Firestore Rules

```bash
./scripts/deploy-firestore-rules.sh
```

### Adding New Admin

```bash
ts-node scripts/setup-firestore-admin.ts <uid> <email> <name>
```

### Seeding Additional Data

```bash
ts-node scripts/seed-firestore-curriculum.ts
```

### Monitoring

- **Vercel Analytics**: View in Vercel dashboard
- **Firebase Console**: Monitor Firestore usage
- **Error Tracking**: Check Vercel function logs
- **Performance**: Use Vercel Analytics

## Quick Reference

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Setup admin
ts-node scripts/setup-firestore-admin.ts <uid> <email> <name>

# Seed curriculum
ts-node scripts/seed-firestore-curriculum.ts

# Deploy to Vercel
vercel --prod
```

## Support

For issues:
1. Check this guide
2. Review error logs
3. Check Firebase/Vercel documentation
4. Review test checklist

## Next Steps

After successful deployment:
1. Set up custom domain (optional)
2. Configure analytics
3. Set up monitoring/alerts
4. Schedule regular backups
5. Document any custom configurations
