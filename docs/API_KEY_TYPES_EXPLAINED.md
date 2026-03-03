# Neon API Key Types Explained

## 🔑 Different Types of Neon Keys

### 1. **Management API Key** (`neon_...`) ✅ For GitHub Actions
- **Format:** Starts with `neon_` (e.g., `neon_abc123...`)
- **Purpose:** Managing Neon resources via API
- **Used for:**
  - Creating/deleting branches
  - Managing projects
  - GitHub Actions workflows
  - Automation scripts
- **Location:** Profile → Developer Settings → API Keys
- **This is what you need for GitHub Actions!**

### 2. **REST API Key** (`napi_...`) ❌ Not for GitHub Actions
- **Format:** Starts with `napi_` (e.g., `napi_4tigv0oz6qls...`)
- **Purpose:** Direct database access via PostgREST API
- **Used for:**
  - Direct REST API calls to database
  - PostgREST queries
  - Frontend direct database access
- **Location:** Project Settings → API Keys
- **Not used for GitHub Actions workflows**

### 3. **CLI Key** (`neonctl-init-...`) ❌ Not for GitHub Actions
- **Format:** `neonctl-init-YYYY-MM-DDTHH-MM-SS`
- **Purpose:** Local CLI tool authentication
- **Used for:**
  - Neon CLI commands
  - Local development tools
- **Location:** CLI configuration
- **Not used for GitHub Actions workflows**

## 🎯 Which Key Do You Need?

### For GitHub Actions Workflow:
✅ **Management API Key** (`neon_...`)

### For Direct Database Access:
✅ **REST API Key** (`napi_...`) - But enable RLS first!

### For Local CLI:
✅ **CLI Key** (`neonctl-...`)

## 📍 How to Get Management API Key

1. Go to: https://console.neon.tech/
2. Click **Profile Icon** (top right)
3. Click **"Developer Settings"** or **"API Keys"**
4. Click **"Create API Key"**
5. Name: `GitHub Actions`
6. Copy the key (starts with `neon_`)

**Direct Link:** https://console.neon.tech/app/api-keys

## 🔒 Security Note

The REST API key you found (`napi_...`) is currently exposing your database publicly because RLS is not enabled. 

**Immediate Actions:**
1. Enable RLS on all tables (see `NEON_SECURITY_FIX.md`)
2. Get the Management API key (`neon_...`) for GitHub Actions
3. Consider disabling public REST API access if not needed

---

**For GitHub Actions:** Use the Management API Key (`neon_...`)

