# Workflow & Deployment Integration Guide

This guide explains how the GitHub Actions workflow integrates with deployment testing and the overall CI/CD pipeline.

## 🔗 Integration Overview

### Workflow Flow
```
PR Created/Updated
    ↓
GitHub Actions Workflow
    ↓
1. Setup (Install dependencies)
    ↓
2. Create Neon Branch (Database for PR)
    ↓
3. Run Migrations (Apply schema changes)
    ↓
4. Seed Database (Optional test data)
    ↓
5. Post Schema Diff (Show changes in PR)
    ↓
6. [Future] Deploy to Preview
    ↓
7. [Future] Run Deployment Tests
```

---

## 📋 Current Workflow Steps

### Job 1: Setup
- ✅ Get branch name
- ✅ Checkout code
- ✅ Setup Node.js
- ✅ Verify project structure
- ✅ Install dependencies

### Job 2: Create Neon Branch & Run Migrations
- ✅ Check Neon credentials
- ✅ Create Neon database branch
- ✅ Verify database URL
- ✅ Run database migrations (`npm run db:push`)
- ✅ Verify migration success
- ✅ Run session table migration (if needed)
- ✅ Seed database (optional)
- ✅ Post schema diff to PR

### Job 3: Delete Neon Branch
- ✅ Delete branch when PR is closed

---

## 🧪 Integration with Deployment Testing

### Current State
The workflow currently:
- ✅ Creates isolated database branches for each PR
- ✅ Runs migrations automatically
- ✅ Verifies migration success
- ✅ Posts schema changes to PR

### Future Integration Points

#### 1. Pre-Deployment Testing
Add a new job that runs before deployment:
```yaml
test_deployment:
  name: Test Deployment Configuration
  needs: create_neon_branch
  runs-on: ubuntu-latest
  steps:
    - name: Verify vercel.json
      run: |
        if [ -f "vercel.json" ]; then
          echo "✅ vercel.json found"
          # Validate JSON structure
          node -e "JSON.parse(require('fs').readFileSync('vercel.json'))"
        fi
    
    - name: Check Security Headers
      run: |
        # Verify security headers are configured
        grep -q "X-Content-Type-Options" vercel.json && echo "✅ Security headers configured"
    
    - name: Verify Session Migration
      run: |
        # Check if session migration exists
        if [ -f "migrations/create-sessions-table.sql" ]; then
          echo "✅ Session migration file exists"
        fi
```

#### 2. Deployment Verification
Add deployment health checks:
```yaml
verify_deployment:
  name: Verify Deployment
  needs: [create_neon_branch, test_deployment]
  runs-on: ubuntu-latest
  steps:
    - name: Check Health Endpoint
      run: |
        # Test health endpoint (if preview URL available)
        curl -f https://preview-url.vercel.app/api/system/health || echo "⚠️ Health check skipped"
    
    - name: Verify Security Headers
      run: |
        # Check security headers on deployed site
        curl -I https://preview-url.vercel.app | grep -i "x-content-type-options" || echo "⚠️ Headers check skipped"
```

---

## 🔄 Integration with DEPLOYMENT_TESTING_COMPLETE.md

### Checklist Integration

The deployment testing checklist can be integrated into the workflow:

```yaml
- name: Run Deployment Tests
  run: |
    echo "🧪 Running deployment tests..."
    
    # Test 1: Health endpoint
    echo "Testing health endpoint..."
    # (Add health check)
    
    # Test 2: Security headers
    echo "Testing security headers..."
    # (Add header verification)
    
    # Test 3: Session persistence
    echo "Testing session persistence..."
    # (Add session test)
```

### Test Results Reporting

Add test results to PR comments:
```yaml
- name: Post Test Results
  uses: actions/github-script@v7
  with:
    script: |
      const results = {
        migrations: '${{ steps.verify_migration.outputs.status }}',
        deployment: 'pending',
        security: 'pending'
      };
      // Post results to PR
```

---

## 📊 Workflow Status Integration

### Current Status Indicators

The workflow provides:
- ✅ Migration status
- ✅ Database branch creation status
- ✅ Schema diff in PR comments

### Enhanced Status Reporting

Add comprehensive status:
```yaml
- name: Workflow Status Summary
  if: always()
  run: |
    echo "## 🚀 Workflow Status" >> $GITHUB_STEP_SUMMARY
    echo "" >> $GITHUB_STEP_SUMMARY
    echo "| Component | Status |" >> $GITHUB_STEP_SUMMARY
    echo "|-----------|--------|" >> $GITHUB_STEP_SUMMARY
    echo "| Setup | ✅ |" >> $GITHUB_STEP_SUMMARY
    echo "| Neon Branch | ${{ job.status == 'success' && '✅' || '❌' }} |" >> $GITHUB_STEP_SUMMARY
    echo "| Migrations | ${{ steps.verify_migration.outputs.status == 'success' && '✅' || '❌' }} |" >> $GITHUB_STEP_SUMMARY
    echo "| Deployment Tests | ⏳ Pending |" >> $GITHUB_STEP_SUMMARY
```

---

## 🔧 Migration Process Explained

### How Migrations Work

1. **Neon Branch Created**
   - Creates isolated database branch: `preview/pr-{NUMBER}-{BRANCH}`
   - Returns connection URLs (direct and pooler)

2. **Migration Script Runs**
   - Uses `npm run db:push` (drizzle-kit push)
   - Applies schema changes from code to database
   - Creates/updates tables based on schema definitions

3. **Session Table Migration**
   - If `migrations/create-sessions-table.sql` exists, it can be run
   - Otherwise, connect-pg-simple auto-creates the table

4. **Verification**
   - Checks migration exit code
   - Verifies database connection
   - Reports success/failure

### Migration Files

- **Schema Definition**: Defined in code (Drizzle ORM)
- **SQL Migration**: `migrations/create-sessions-table.sql` (manual)
- **Auto-Migration**: `npm run db:push` (automatic)

---

## 🐛 Branch Management Explained

### Branch Lifecycle

1. **Creation**
   - Triggered: PR opened/updated
   - Name: `preview/pr-{PR_NUMBER}-{BRANCH_NAME}`
   - Expires: 14 days from creation
   - Purpose: Isolated database for PR testing

2. **Usage**
   - Used for: Running migrations, testing schema changes
   - Access: Via DATABASE_URL from workflow
   - Isolation: Each PR gets its own branch

3. **Deletion**
   - Triggered: PR closed/merged
   - Action: Automatically deletes the branch
   - Cleanup: Frees up Neon resources

### Branch Naming Convention

```
preview/pr-{PR_NUMBER}-{BRANCH_NAME}
```

Examples:
- `preview/pr-5-test-feature`
- `preview/pr-11-fix-bug`
- `preview/pr-20-add-migrations`

---

## 🔍 Troubleshooting Integration

### Issue: Migrations Not Running

**Check:**
1. "Check Neon Credentials" step passes
2. "Create Neon Branch" step succeeds
3. "Verify Database URL" step shows URL
4. "Run Database Migrations" step exists and runs

**Solution:**
- Verify `npm run db:push` exists in package.json
- Check DATABASE_URL is set correctly
- Review migration step logs for errors

### Issue: Schema Diff Not Posted

**Check:**
1. "Post Schema Diff Comment to PR" step exists
2. NEON_API_KEY has correct permissions
3. Branch name matches PR number

**Solution:**
- Verify API key permissions in Neon
- Check branch name format
- Review schema-diff-action logs

### Issue: Branch Not Deleted

**Check:**
1. PR is actually closed (not just merged)
2. "Delete Neon Branch" job runs
3. Credentials are set

**Solution:**
- Manually delete branch in Neon console if needed
- Verify workflow triggers on PR close

---

## 📈 Next Steps for Full Integration

### Phase 1: Current (✅ Complete)
- [x] Neon branch creation
- [x] Migration execution
- [x] Schema diff posting

### Phase 2: Testing Integration (⏳ Pending)
- [ ] Add deployment configuration tests
- [ ] Add security header verification
- [ ] Add health endpoint checks
- [ ] Integrate with deployment test script

### Phase 3: Deployment Integration (⏳ Future)
- [ ] Auto-deploy to preview environment
- [ ] Run deployment tests automatically
- [ ] Post test results to PR
- [ ] Block merge if tests fail

---

## 🔗 Related Documentation

- **DEPLOYMENT_TESTING_COMPLETE.md** - Deployment testing guide
- **DEPLOYMENT_IMPROVEMENTS_COMPLETE.md** - Deployment improvements summary
- **GITHUB_ACTIONS_COMPLETE_FIX.md** - Workflow troubleshooting
- **migrations/create-sessions-table.sql** - Session table migration

---

**Status:** Workflow Complete, Integration Pending  
**Last Updated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
