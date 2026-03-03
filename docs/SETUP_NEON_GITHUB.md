# Neon + GitHub Actions Setup Guide

## 🚀 Quick Setup Steps

### Step 1: Get Your Neon API Key

1. **Go to Neon Console:**
   - Visit: https://console.neon.tech/
   - Sign in to your account

2. **Navigate to API Keys:**
   - Click on your profile icon (top right)
   - Go to **"Developer Settings"** or **"API Keys"**
   - Click **"Create API Key"**

3. **Create the Key:**
   - Name: `GitHub Actions` (or any name you prefer)
   - Click **"Create"**
   - **⚠️ IMPORTANT:** Copy the API key immediately (starts with `neon_`)
   - You won't be able to see it again!

### Step 2: Get Your Neon Project ID

1. **In Neon Console:**
   - Select your project (the one you're using for LearnConnect)
   - Go to **"Settings"** → **"General"**
   - Find **"Project ID"** (format: `ep-xxxxx-xxxxx` or similar)
   - Copy the Project ID

### Step 3: Add to GitHub Secrets & Variables

1. **Go to Your GitHub Repository:**
   - Navigate to your LearnConnect repository on GitHub
   - Click **"Settings"** (top menu)
   - Click **"Secrets and variables"** → **"Actions"**

2. **Add Secret (NEON_API_KEY):**
   - Click **"New repository secret"**
   - Name: `NEON_API_KEY`
   - Value: Paste your Neon API key
   - Click **"Add secret"**

3. **Add Variable (NEON_PROJECT_ID):**
   - Click **"Variables"** tab
   - Click **"New repository variable"**
   - Name: `NEON_PROJECT_ID`
   - Value: Paste your Neon Project ID
   - Click **"Add variable"**

### Step 4: Commit Workflow Files

The workflow files are already created. You just need to commit them:

```bash
# Add the workflow files
git add .github/workflows/

# Commit
git commit -m "Add Neon branch workflow for pull requests"

# Push to GitHub
git push
```

### Step 5: Create a Test PR

1. **Create a test branch:**
   ```bash
   git checkout -b test/neon-workflow
   ```

2. **Make a small change:**
   ```bash
   # Add a comment or make a small change
   echo "# Test PR for Neon workflow" >> README.md
   git add README.md
   git commit -m "Test: Verify Neon workflow"
   git push origin test/neon-workflow
   ```

3. **Create Pull Request:**
   - Go to your GitHub repository
   - Click **"Pull requests"** → **"New pull request"**
   - Select `test/neon-workflow` branch
   - Click **"Create pull request"**

4. **Verify Workflow:**
   - Go to **"Actions"** tab in GitHub
   - You should see the workflow running
   - Check Neon Console → **"Branches"** to see the new preview branch

## ✅ Verification Checklist

- [ ] Neon API key obtained and copied
- [ ] Neon Project ID obtained and copied
- [ ] `NEON_API_KEY` added to GitHub Secrets
- [ ] `NEON_PROJECT_ID` added to GitHub Variables
- [ ] Workflow files committed and pushed
- [ ] Test PR created
- [ ] Workflow runs successfully in GitHub Actions
- [ ] Neon branch created in Neon Console

## 🔍 Troubleshooting

### Workflow Fails: "Project not found"
- ✅ Verify `NEON_PROJECT_ID` variable is correct
- ✅ Check the Project ID in Neon Console matches

### Workflow Fails: "Unauthorized"
- ✅ Verify `NEON_API_KEY` secret is correct
- ✅ Check the API key hasn't expired
- ✅ Ensure API key has proper permissions

### No Branch Created
- ✅ Check GitHub Actions logs for errors
- ✅ Verify both secret and variable are set
- ✅ Check workflow file is in `.github/workflows/` directory

## 📊 What Happens Next

Once set up, every time you:
- **Open a PR:** A new Neon branch is created automatically
- **Update a PR:** The Neon branch is updated
- **Close a PR:** The Neon branch is deleted automatically

This gives you isolated database environments for each PR, perfect for testing!

---

**Need Help?** Check `.github/NEON_WORKFLOW_SETUP.md` for detailed documentation.

