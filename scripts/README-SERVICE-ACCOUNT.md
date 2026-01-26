# Firebase Service Account Key Usage

## ✅ Good News

Your service account key (`scripts/service-account-key.json`) is:
- ✅ **NOT tracked by git** (safe!)
- ✅ **Added to .gitignore** (will stay safe)
- ✅ Ready to use with the deployment scripts

## 📋 How to Use

### 1. Verify Security Status

Run the security check script:

```powershell
.\scripts\check-service-account-security.ps1
```

This will verify:
- File is not tracked by git
- File is properly ignored
- File is not in git history

### 2. Using with Setup Scripts

The service account key is used by these scripts:

#### Setup Firestore Admin
```powershell
ts-node scripts/setup-firestore-admin.ts <uid> <email> <displayName>
```

#### Seed Firestore Curriculum
```powershell
ts-node scripts/seed-firestore-curriculum.ts
```

Both scripts will automatically look for the key at:
- `./service-account-key.json` (project root)
- `./scripts/service-account-key.json` (scripts folder)
- Or set `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable with the path

### 3. Your Current Key Details

- **Project ID**: `learnconnect-7c499`
- **Service Account Email**: `firebase-adminsdk-fbsvc@learnconnect-7c499.iam.gserviceaccount.com`
- **Location**: `scripts/service-account-key.json`

## 🔒 Security Best Practices

### ✅ DO:
- Keep the file in `scripts/` folder (already in `.gitignore`)
- Use it only for local development and one-time setup scripts
- Rotate the key periodically (every 6-12 months)
- Use environment variables for production deployments

### ❌ DON'T:
- Commit the file to git (already protected by `.gitignore`)
- Share the file publicly
- Use the same key for multiple projects
- Store it in version control

## 🔄 Rotating the Key (When Needed)

If you need to rotate the service account key:

1. **Generate New Key**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select project: `learnconnect-7c499`
   - Navigate to **Settings** > **Service Accounts**
   - Click **Generate New Private Key**
   - Download the new JSON file

2. **Replace Old Key**:
   ```powershell
   # Backup old key (optional)
   Copy-Item scripts/service-account-key.json scripts/service-account-key.json.backup
   
   # Replace with new key
   # (Save the downloaded file as scripts/service-account-key.json)
   ```

3. **Delete Old Key** (in Firebase Console):
   - Go to **IAM & Admin** > **Service Accounts**
   - Find the old service account
   - Delete it (or disable it)

## 🚀 Next Steps

Now that your service account key is set up securely, you can:

1. **Deploy Firestore Rules**:
   ```powershell
   .\scripts\deploy-firestore-rules.sh
   ```

2. **Setup Admin User**:
   ```powershell
   # First create admin in PostgreSQL
   ts-node server/create-admin.ts admin@learnconnect.com Admin123! "System Admin"
   
   # Then add to Firestore (use UID from step above)
   ts-node scripts/setup-firestore-admin.ts <uid> admin@learnconnect.com "System Admin"
   ```

3. **Seed MEB Curriculum**:
   ```powershell
   ts-node scripts/seed-firestore-curriculum.ts
   ```

## 📝 Troubleshooting

### "Service account key not found"
- Verify file exists at `scripts/service-account-key.json`
- Check file permissions (should be readable)
- Verify JSON format is valid

### "Permission denied" errors
- Check service account has proper permissions in Firebase Console
- Verify project ID matches: `learnconnect-7c499`
- Ensure Firestore API is enabled

### "Invalid credentials"
- Key may have been rotated or deleted
- Generate a new key from Firebase Console
- Replace the old key file

## 🔗 Related Documentation

- [DEPLOYMENT.md](../DEPLOYMENT.md) - Full deployment guide
- [SECURITY_WARNING.md](../SECURITY_WARNING.md) - Security best practices
- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
