# Database Setup Guide

## Quick Setup Options

### Option 1: Use Neon (Cloud PostgreSQL - Recommended)

1. **Sign up for Neon** (free tier available):
   - Visit: https://console.neon.tech/
   - Create a free account
   - Create a new project

2. **Get your connection string**:
   - In Neon dashboard, go to your project
   - Click on "Connection Details"
   - Copy the connection string (starts with `postgresql://`)

3. **Add to .env file**:
   ```powershell
   # In LearnConnect directory
   $DATABASE_URL = "postgresql://user:password@host/dbname?sslmode=require"
   Add-Content -Path .env -Value "DATABASE_URL=$DATABASE_URL"
   ```

### Option 2: Use Local PostgreSQL

1. **Install PostgreSQL** (if not already installed):
   - Download from: https://www.postgresql.org/download/windows/
   - Or use: `choco install postgresql` (if you have Chocolatey)

2. **Create a database**:
   ```sql
   CREATE DATABASE learnconnect;
   ```

3. **Add to .env file**:
   ```powershell
   Add-Content -Path .env -Value "DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/learnconnect"
   ```

### Option 3: Use Replit Database (if deploying on Replit)

- Replit automatically provides `DATABASE_URL` environment variable
- No manual setup needed

## Create .env File

1. **Copy the example file**:
   ```powershell
   Copy-Item .env.example .env
   ```

2. **Edit .env file** and add your `DATABASE_URL`:
   ```powershell
   notepad .env
   ```

3. **Or use PowerShell**:
   ```powershell
   # Read the example
   Get-Content .env.example
   
   # Create .env with your DATABASE_URL
   @"
   DATABASE_URL=your_connection_string_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   STRIPE_SECRET_KEY=your_stripe_secret_key_here
   VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key_here
   VITE_AI_MODEL=claude-sonnet-3.5
   VITE_AI_ENABLED=true
   "@ | Out-File -FilePath .env -Encoding utf8
   ```

## Verify Setup

1. **Test database connection**:
   ```powershell
   node wake-db.js
   ```

2. **Run database migrations** (if needed):
   ```powershell
   npm run db:push
   ```

3. **Seed the database** (optional):
   ```powershell
   npm run seed:meb
   ```

## Troubleshooting

### Error: "DATABASE_URL must be set"
- Make sure `.env` file exists in the `LearnConnect` directory
- Verify `DATABASE_URL` is set in the `.env` file
- Restart the server after creating/updating `.env`

### Error: "Connection refused" or "Connection timeout"
- Check if your database server is running
- Verify the connection string is correct
- For Neon: Make sure the database endpoint is not paused

### Error: "SSL required"
- Add `?sslmode=require` to your connection string
- Example: `postgresql://user:pass@host/db?sslmode=require`

