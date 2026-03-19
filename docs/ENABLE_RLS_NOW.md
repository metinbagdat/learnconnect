# 🔒 Enable RLS - Step by Step

## ⚠️ CRITICAL: Your Database is Publicly Accessible!

Follow these steps to secure your database immediately.

## Step 1: Open Neon SQL Editor

1. Go to: https://console.neon.tech/
2. Sign in
3. Select your project
4. Click **"SQL Editor"** in the left sidebar (or top menu)

## Step 2: Run the RLS Script

1. In the SQL Editor, create a new query
2. Copy the entire contents of `server/scripts/enable-rls.sql`
3. Paste it into the SQL Editor
4. Click **"Run"** or press `Ctrl+Enter`

## Step 3: Verify RLS is Enabled

Run this query to check:

```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should show `rowsecurity = true`

## Alternative: Enable RLS via Neon Console

If SQL Editor doesn't work:

1. Go to your project in Neon Console
2. Look for **"Settings"** → **"Security"** or **"Database"**
3. Find **"Row Level Security"** option
4. Enable it for all tables

## After Enabling RLS

You'll need to create policies. For now, you can use a simple policy:

```sql
-- Allow authenticated users (via your app) to access their own data
-- This is a basic policy - adjust based on your needs

-- Example: Users can see their own records
CREATE POLICY "Users can view own user record" ON users
  FOR SELECT USING (true); -- Adjust this based on your auth system

-- Example: Public courses are viewable
CREATE POLICY "Public courses are viewable" ON courses
  FOR SELECT USING (true);
```

---

**Priority:** 🔴 **HIGH** - Do this immediately to secure your data!

