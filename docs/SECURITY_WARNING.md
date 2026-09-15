# ⚠️ CRITICAL SECURITY WARNING

## Service Account Key Exposed

Your Firebase service account key (`scripts/service-account-key.json`) contains sensitive credentials that should **NEVER** be committed to version control.

## Immediate Actions Required

### 1. Check if File is Already Committed

```bash
# Check if file is tracked by git
git ls-files | grep service-account-key.json

# If it shows up, it's already committed!
```

### 2. If Already Committed - Remove from Git History

**⚠️ WARNING: This will rewrite git history. Only do this if the repository is private or you coordinate with your team.**

```bash
# Remove from git tracking (but keep local file)
git rm --cached scripts/service-account-key.json

# Add to .gitignore (already done)
# git add .gitignore

# Commit the removal
git commit -m "Remove service account key from version control"

# If already pushed, you need to force push (DANGEROUS - coordinate first!)
# git push --force
```

### 3. Rotate the Service Account Key

**IMPORTANT: Since the key may have been exposed, you should rotate it:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `learnconnect-7c499`
3. Go to **Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Download the new key
6. **Delete the old service account** (or disable it)
7. Replace `scripts/service-account-key.json` with the new key

### 4. Verify .gitignore is Working

```bash
# Test that git ignores the file
git status
# service-account-key.json should NOT appear in untracked files
```

## Best Practices Going Forward

### ✅ DO:
- Keep service account keys in `.gitignore`
- Store keys in environment variables for production
- Use Vercel environment variables for deployment
- Share keys securely (password managers, encrypted channels)
- Rotate keys regularly

### ❌ DON'T:
- Commit service account keys to git
- Share keys in chat/email
- Store keys in public repositories
- Use the same key for development and production

## Alternative: Use Environment Variables

Instead of a file, you can use environment variables:

```bash
# Set as environment variable
export FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Or in .env.local (already in .gitignore)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

Then update scripts to read from environment:

```typescript
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : JSON.parse(fs.readFileSync('./service-account-key.json', 'utf8'));
```

## Current Status

- ✅ `.gitignore` updated to exclude service account keys
- ⚠️ **You need to check if the file is already committed**
- ⚠️ **You should rotate the service account key**

## Next Steps

1. Check git history for the file
2. If committed, remove it (coordinate with team if shared repo)
3. Rotate the service account key in Firebase Console
4. Verify `.gitignore` is working
5. Update scripts to use environment variables (optional but recommended)
