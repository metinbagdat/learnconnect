# Complete Troubleshooting Guide - GitHub Actions & Deployment

## 🔍 Quick Diagnosis

### Step 1: Check Workflow Status
1. Go to: https://github.com/metinbagdat/learnconnect-/actions
2. Find the latest workflow run
3. Check which step failed

### Step 2: Identify Issue Category
- 🔐 **Credentials Issue**: "NEON_API_KEY is not set" or "NEON_PROJECT_ID is not set"
- 🗄️ **Database Issue**: "DATABASE_URL is empty" or "Connection failed"
- 🔄 **Migration Issue**: "Migration failed" or "db:push error"
- 🌿 **Branch Issue**: "Branch creation failed" or "Branch not found"

---

## 🔐 Issue 1: NEON_API_KEY Secret Not Working

### Symptoms
- Error: "NEON_API_KEY is not set!"
- Error: "Please add NEON_API_KEY as a repository secret"
- Workflow fails at "Check Neon Credentials" step

### Diagnosis

**Check 1: Secret Location**
1. Go to: https://github.com/metinbagdat/learnconnect-/settings/secrets/actions
2. Verify `NEON_API_KEY` exists under **"Repository secrets"** (not Environment secrets)
3. Check "Last updated" timestamp

**Check 2: Secret Name**
- Must be exactly: `NEON_API_KEY` (case-sensitive, no spaces)
- Not: `neon_api_key`, `NEON-API-KEY`, or `NeonApiKey`

**Check 3: Secret Value**
- Should start with: `neon_`
- Should be the full API key from Neon Console
- No leading/trailing spaces

### Solution

**Step 1: Get Fresh API Key**
1. Go to: https://console.neon.tech/
2. Click your profile → **Developer Settings**
3. Find existing key or **Create API Key**
4. Copy the entire key (starts with `neon_`)

**Step 2: Update Secret**
1. In GitHub: Settings → Secrets and variables → Actions
2. Find `NEON_API_KEY`
3. Click **Edit** (pencil icon)
4. Delete old value completely
5. Paste new API key (no spaces)
6. Click **Update secret**

**Step 3: Verify**
1. Create a new PR or update existing PR
2. Check workflow run
3. "Check Neon Credentials" step should pass

### Alternative: Recreate Secret
If editing doesn't work:
1. Delete the secret completely
2. Click **New repository secret**
3. Name: `NEON_API_KEY`
4. Value: Your API key
5. Click **Add secret**

---

## 🗄️ Issue 2: NEON_PROJECT_ID Variable Not Set

### Symptoms
- Error: "NEON_PROJECT_ID is not set!"
- Error: "Please add NEON_PROJECT_ID as a repository variable"

### Diagnosis

**Check 1: Variable Location**
1. Go to: https://github.com/metinbagdat/learnconnect-/settings/variables/actions
2. Click **Variables** tab (not Secrets)
3. Verify `NEON_PROJECT_ID` exists

**Check 2: Variable Value**
- Should be your Neon Project ID (e.g., `ep-xxxxx-xxxxx`)
- Get it from: https://console.neon.tech/ → Your Project → Settings → General

### Solution

**Step 1: Get Project ID**
1. Go to: https://console.neon.tech/
2. Select your project
3. Go to **Settings** → **General**
4. Copy the **Project ID** (looks like `ep-xxxxx-xxxxx`)

**Step 2: Add Variable**
1. In GitHub: Settings → Secrets and variables → Actions
2. Click **Variables** tab
3. Click **New repository variable**
4. Name: `NEON_PROJECT_ID`
5. Value: Your Project ID
6. Click **Add variable**

---

## 🔄 Issue 3: Database URL Empty

### Symptoms
- Error: "DATABASE_URL is empty!"
- Error: "Cannot run migrations"
- "Verify Database URL" step fails

### Diagnosis

**Check 1: Branch Creation**
- Look at "Create Neon Branch" step
- Should show: ✅ Branch created successfully
- Should output database URLs

**Check 2: Credentials**
- Verify "Check Neon Credentials" step passed
- NEON_API_KEY and NEON_PROJECT_ID are set

**Check 3: API Permissions**
- API key might not have branch creation permissions
- Check Neon Console for API key permissions

### Solution

**Step 1: Verify Branch Creation**
1. Check "Create Neon Branch" step logs
2. Look for error messages
3. Common errors:
   - Invalid API key
   - Invalid Project ID
   - Rate limit exceeded
   - Network error

**Step 2: Check API Key Permissions**
1. Go to: https://console.neon.tech/account/api-keys
2. Verify your API key is active
3. Check if it has branch creation permissions
4. Create new API key if needed

**Step 3: Verify Project ID**
1. Go to: https://console.neon.tech/
2. Select your project
3. Verify Project ID matches what's in GitHub

---

## 🔄 Issue 4: Migration Failed

### Symptoms
- Error: "Migration failed"
- Error: "drizzle-kit push" failed
- "Run Database Migrations" step fails

### Diagnosis

**Check 1: Migration Script**
- Verify `npm run db:push` exists in package.json
- Should be: `"db:push": "drizzle-kit push"`

**Check 2: Dependencies**
- Verify `drizzle-kit` is installed
- Check package.json for drizzle-kit in devDependencies

**Check 3: Database Connection**
- DATABASE_URL should be set
- Connection string should be valid
- Database should be accessible

**Check 4: Schema Conflicts**
- Check migration logs for schema errors
- Look for table/column conflicts

### Solution

**Step 1: Verify Migration Script**
```json
// package.json should have:
{
  "scripts": {
    "db:push": "drizzle-kit push"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.8"
  }
}
```

**Step 2: Check Drizzle Config**
- Verify `drizzle.config.ts` exists
- Check database connection configuration
- Verify schema files are correct

**Step 3: Test Locally**
```bash
# Test migration locally
npm run db:push
```

**Step 4: Check Migration Logs**
- Review "Run Database Migrations" step output
- Look for specific error messages
- Common errors:
  - Connection timeout
  - Schema validation errors
  - Missing tables/columns

---

## 🌿 Issue 5: Branch Creation Failed

### Symptoms
- Error: "Failed to create branch"
- "Create Neon Branch" step fails
- No database URL returned

### Diagnosis

**Check 1: API Key**
- Verify NEON_API_KEY is correct
- Check API key hasn't expired
- Verify API key has branch creation permissions

**Check 2: Project ID**
- Verify NEON_PROJECT_ID is correct
- Check project exists in Neon Console
- Verify project is active (not paused)

**Check 3: Branch Name**
- Check branch name format
- Should be: `preview/pr-{NUMBER}-{BRANCH}`
- No special characters that might cause issues

**Check 4: Rate Limits**
- Check if Neon API rate limit exceeded
- Wait a few minutes and retry

### Solution

**Step 1: Verify Credentials**
1. Re-check NEON_API_KEY and NEON_PROJECT_ID
2. Get fresh values from Neon Console
3. Update in GitHub if needed

**Step 2: Check Neon Console**
1. Go to: https://console.neon.tech/
2. Verify project is active
3. Check for any service issues
4. Verify API key is active

**Step 3: Test API Key**
1. Try creating a branch manually in Neon Console
2. If that fails, API key might not have permissions
3. Create new API key with full permissions

---

## 🔄 Issue 6: Migration Script Not Found

### Symptoms
- Error: "Migration script 'db:push' not found"
- Error: "npm run db:push" command not found

### Solution

**Step 1: Verify package.json**
```json
{
  "scripts": {
    "db:push": "drizzle-kit push"
  }
}
```

**Step 2: Add Script if Missing**
1. Edit package.json
2. Add to scripts section:
   ```json
   "db:push": "drizzle-kit push"
   ```
3. Commit and push

**Step 3: Verify Dependencies**
```json
{
  "devDependencies": {
    "drizzle-kit": "^0.31.8"
  }
}
```

---

## 🔄 Issue 7: Session Table Migration Issues

### Symptoms
- Error: "session table does not exist"
- Session storage not working after migration

### Solution

**Option 1: Auto-Creation (Recommended)**
- connect-pg-simple will auto-create the table
- Ensure `createTableIfMissing: true` in session config

**Option 2: Manual Migration**
1. Run SQL migration manually:
   ```sql
   -- Use migrations/create-sessions-table.sql
   ```
2. Or run in Neon Console SQL Editor

**Option 3: Check Migration File**
- Verify `migrations/create-sessions-table.sql` exists
- Check SQL syntax is correct
- Run manually if auto-creation fails

---

## 🔍 Issue 8: Schema Diff Not Posted

### Symptoms
- "Post Schema Diff Comment to PR" step fails
- No schema diff comment appears in PR

### Diagnosis

**Check 1: API Key Permissions**
- API key needs PR comment permissions
- Verify API key has correct scope

**Check 2: Branch Name**
- Verify branch name matches PR number
- Format: `preview/pr-{NUMBER}-{BRANCH}`

**Check 3: Action Version**
- Verify using latest `neondatabase/schema-diff-action@v1`
- Check action is compatible

### Solution

**Step 1: Verify API Key**
1. Check API key has PR write permissions
2. Create new API key if needed
3. Update in GitHub secrets

**Step 2: Check Branch Name**
- Verify branch name in "Create Neon Branch" step
- Should match format used in schema-diff-action

**Step 3: Check Action Logs**
- Review "Post Schema Diff" step logs
- Look for specific error messages
- May be non-critical (continue-on-error: true)

---

## 📊 Workflow Status Checklist

Use this checklist to diagnose issues:

### Pre-Workflow
- [ ] NEON_API_KEY secret exists in Repository secrets
- [ ] NEON_PROJECT_ID variable exists in Repository variables
- [ ] Both have correct values from Neon Console

### During Workflow
- [ ] "Check Neon Credentials" step passes
- [ ] "Create Neon Branch" step succeeds
- [ ] "Verify Database URL" step shows URL
- [ ] "Run Database Migrations" step completes
- [ ] "Verify Migration Success" step passes

### Post-Workflow
- [ ] Schema diff comment appears in PR
- [ ] Neon branch exists in Neon Console
- [ ] Database is accessible with provided URL

---

## 🔗 Quick Links

- **GitHub Secrets**: https://github.com/metinbagdat/learnconnect-/settings/secrets/actions
- **GitHub Variables**: https://github.com/metinbagdat/learnconnect-/settings/variables/actions
- **Neon Console**: https://console.neon.tech/
- **Neon API Keys**: https://console.neon.tech/account/api-keys
- **Workflow Runs**: https://github.com/metinbagdat/learnconnect-/actions

---

## 🆘 Still Having Issues?

### Get More Help

1. **Check Workflow Logs**
   - Go to failed workflow run
   - Expand failed step
   - Look for specific error messages

2. **Check Neon Console**
   - Verify project is active
   - Check for service status
   - Review API usage

3. **Test Locally**
   - Run migrations locally: `npm run db:push`
   - Test database connection
   - Verify credentials work

4. **Review Documentation**
   - GITHUB_ACTIONS_COMPLETE_FIX.md
   - WORKFLOW_DEPLOYMENT_INTEGRATION.md
   - DEPLOYMENT_TESTING_COMPLETE.md

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
