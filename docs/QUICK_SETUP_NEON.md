# ⚡ Quick Setup: Neon + GitHub Actions

## 📋 Step-by-Step Instructions

### 1️⃣ Get Neon API Key (2 minutes)

1. Open: https://console.neon.tech/
2. Sign in
3. Click your profile → **Developer Settings** → **API Keys**
4. Click **Create API Key**
5. Name: `GitHub Actions`
6. **Copy the key** (starts with `neon_`) - you won't see it again!

### 2️⃣ Get Neon Project ID (1 minute)

1. In Neon Console, select your project
2. Go to **Settings** → **General**
3. Copy the **Project ID** (looks like: `ep-xxxxx-xxxxx`)

### 3️⃣ Add to GitHub (2 minutes)

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**

2. **Add Secret:**
   - Click **New repository secret**
   - Name: `NEON_API_KEY`
   - Value: [paste your API key]
   - Click **Add secret**

3. **Add Variable:**
   - Click **Variables** tab
   - Click **New repository variable**
   - Name: `NEON_PROJECT_ID`
   - Value: [paste your Project ID]
   - Click **Add variable**

### 4️⃣ Commit & Push (1 minute)

```bash
git commit -m "Add Neon branch workflow for pull requests"
git push
```

### 5️⃣ Test It (2 minutes)

```bash
# Create test branch
git checkout -b test/neon-workflow

# Make a small change
echo "# Test" >> README.md
git add README.md
git commit -m "Test Neon workflow"
git push origin test/neon-workflow
```

Then create a PR on GitHub and check:
- **Actions** tab → See workflow running
- **Neon Console** → **Branches** → See new preview branch

---

## ✅ Done!

Your workflow will now:
- ✅ Create Neon branch for each PR
- ✅ Run migrations automatically
- ✅ Delete branch when PR closes

---

**Total Time:** ~8 minutes

