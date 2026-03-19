# How to Find Your Neon API Key for GitHub Actions

## ⚠️ Important: API Key vs CLI Key

The key you found (`neonctl-init-2025-12-10T16-28-18`) is likely a **CLI key**, not the **API key** needed for GitHub Actions.

## ✅ Correct API Key Location

### Method 1: Through Neon Console (Recommended)

1. **Go to Neon Console:**
   - Visit: https://console.neon.tech/
   - Sign in

2. **Navigate to API Keys:**
   - Click your **profile icon** (top right corner)
   - Look for one of these options:
     - **"Developer Settings"** → **"API Keys"**
     - **"Account Settings"** → **"API Keys"**
     - **"Settings"** → **"API Keys"**
     - Direct link: https://console.neon.tech/app/api-keys

3. **Create API Key:**
   - Click **"Create API Key"** or **"New API Key"**
   - Name it: `GitHub Actions`
   - Click **"Create"**
   - **Copy the key immediately** - it should start with `neon_` (like `neon_xxxxxxxxxxxxx`)
   - ⚠️ **You won't be able to see it again!**

### Method 2: Direct Link

Try this direct link to API keys:
- https://console.neon.tech/app/api-keys

## 🔍 How to Identify the Correct Key

**✅ Correct API Key (for GitHub Actions):**
- Starts with `neon_` (e.g., `neon_abc123def456...`)
- Found in: Developer Settings → API Keys
- Used for: API access, GitHub Actions, automation

**❌ CLI Key (NOT for GitHub Actions):**
- Looks like: `neonctl-init-2025-12-10T16-28-18`
- Found in: CLI/Command line tools
- Used for: Local development, CLI commands

## 📝 Step-by-Step with Screenshots Guide

### Step 1: Access API Keys
1. Sign in to https://console.neon.tech/
2. Click your **profile/avatar** (top right)
3. Look for **"Developer Settings"** or **"API Keys"** in the dropdown

### Step 2: Create New Key
1. Click **"Create API Key"** button
2. Enter name: `GitHub Actions`
3. Click **"Create"** or **"Generate"**

### Step 3: Copy the Key
1. The key will be displayed (starts with `neon_`)
2. **Copy it immediately** - you can't see it again!
3. It should look like: `neon_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## 🎯 What to Do with Your Current Key

If you only see the `neonctl-init-...` key:
1. That's a CLI key, not an API key
2. You need to create a new **API key** specifically
3. Follow the steps above to create one

## ✅ Verification

Once you have the key:
- ✅ Should start with `neon_`
- ✅ Should be long (30+ characters)
- ✅ Should be shown only once when created
- ✅ Can be used in GitHub Actions workflow

## 🆘 Still Can't Find It?

If you can't find the API Keys section:
1. Check if you're on the right account
2. Try the direct link: https://console.neon.tech/app/api-keys
3. Look for "Developer Settings" or "Account Settings" in your profile menu
4. Some accounts might need to enable API access first

## 📞 Alternative: Check Neon Documentation

- Neon API Docs: https://neon.tech/docs/api-reference
- GitHub Actions Guide: https://neon.tech/docs/guides/github-actions

---

**Remember:** The API key for GitHub Actions must start with `neon_`, not `neonctl-`!

