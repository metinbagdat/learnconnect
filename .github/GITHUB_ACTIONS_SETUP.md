# GitHub Actions Setup - Quick Fix Guide

## Problem
GitHub Actions workflow is failing with:
```
Error Please provide required params for Postgres driver: [x] url: ''
```

This means `DATABASE_URL` environment variable is empty during the migration step.

## Solution: Add GitHub Secrets and Variables

### Step 1: Add Neon API Key (Secret)

1. Go to your GitHub repository: https://github.com/metinbagdat/learnconnect-
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - **Name:** `NEON_API_KEY`
   - **Value:** Your Neon API key (get it from https://console.neon.tech/ → Account Settings → Developer Settings)
   - Click **Add secret**

### Step 2: Add Neon Project ID (Variable)

1. Still in **Secrets and variables** → **Actions**
2. Click **Variables** tab
3. Click **New repository variable**
4. Add:
   - **Name:** `NEON_PROJECT_ID`
   - **Value:** Your Neon Project ID (from https://console.neon.tech/ → Your Project → Settings → General)
   - Click **Add variable**

### Step 3: Verify

After adding both:
1. Go to your PR or trigger the workflow again
2. The workflow should now be able to:
   - Create Neon branches
   - Get the DATABASE_URL from the branch creation
   - Run migrations successfully

## What the Workflow Does

1. **Creates a Neon branch** for each PR
2. **Gets the DATABASE_URL** from the branch creation output
3. **Runs migrations** using `npm run db:push`
4. **Optionally seeds** the database
5. **Posts schema diff** to the PR as a comment

## Troubleshooting

If it still fails:
- Verify the API key is correct and has permissions
- Check that the Project ID matches your Neon project
- Look at the workflow logs to see if branch creation succeeded
- The DATABASE_URL should be automatically provided by the Neon action

