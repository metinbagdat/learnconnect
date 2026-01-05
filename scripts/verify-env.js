#!/usr/bin/env node

/**
 * Environment Variable Verification Script
 * 
 * Checks for required environment variables before build.
 * This script can be run manually or as part of prebuild hook.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Required environment variables for production (server will fail without these)
const REQUIRED_PROD_VARS = [
  'DATABASE_URL',          // Required by server/db.ts
  'ANTHROPIC_API_KEY',     // Required by server/ai/ai-reasoning.engine.ts
  'ANTHROPIC_MODEL',       // Required by server/ai/ai-reasoning.engine.ts
];

// Highly recommended for production (security/functionality)
const RECOMMENDED_PROD_VARS = [
  'SESSION_SECRET',        // Recommended by server/auth.ts (security warning in production)
];

// Optional but recommended environment variables
const OPTIONAL_VARS = [
  'OPENAI_API_KEY',
  'DEEPSEEK_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'VITE_STRIPE_PUBLIC_KEY',
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
];

// Check if .env file exists
function checkEnvFile() {
  const envPath = path.resolve(__dirname, '..', '.env');
  return fs.existsSync(envPath);
}

// Check if environment variable is set
function isEnvVarSet(varName) {
  const value = process.env[varName];
  return value && value.trim().length > 0;
}

// Main verification function
function verifyEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  const envFileExists = checkEnvFile();
  
  log('\n' + '='.repeat(50), colors.bright);
  log('Environment Variable Verification', colors.bright);
  log('='.repeat(50), colors.bright);
  
  log(`\nEnvironment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`, colors.blue);
  log(`.env file exists: ${envFileExists ? 'Yes' : 'No'}`, envFileExists ? colors.green : colors.yellow);
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // Check required variables (server will fail without these)
  log('\n📋 Required Variables (Production - Server will fail without these):', colors.bright);
  for (const varName of REQUIRED_PROD_VARS) {
    const isSet = isEnvVarSet(varName);
    if (isProduction && !isSet) {
      log(`  ❌ ${varName} - NOT SET (CRITICAL - Server will fail!)`, colors.red);
      hasErrors = true;
    } else if (!isSet) {
      log(`  ⚠️  ${varName} - NOT SET (Required for production)`, colors.yellow);
      hasWarnings = true;
    } else {
      // Mask sensitive values
      const value = process.env[varName];
      const masked = value.length > 10 
        ? `${value.substring(0, 6)}...${value.substring(value.length - 4)}`
        : '***';
      log(`  ✅ ${varName} - Set (${masked})`, colors.green);
    }
  }
  
  // Check recommended variables
  log('\n📋 Recommended Variables (Production - Security/Functionality):', colors.bright);
  for (const varName of RECOMMENDED_PROD_VARS) {
    const isSet = isEnvVarSet(varName);
    if (isProduction && !isSet) {
      log(`  ⚠️  ${varName} - NOT SET (Recommended for production security)`, colors.yellow);
      hasWarnings = true;
    } else if (!isSet) {
      log(`  ⚠️  ${varName} - NOT SET (Recommended for production)`, colors.yellow);
      hasWarnings = true;
    } else {
      log(`  ✅ ${varName} - Set`, colors.green);
    }
  }
  
  // Check optional variables
  log('\n📋 Optional Variables:', colors.bright);
  for (const varName of OPTIONAL_VARS) {
    const isSet = isEnvVarSet(varName);
    if (isSet) {
      log(`  ✅ ${varName} - Set`, colors.green);
    } else {
      log(`  ⚪ ${varName} - Not set (Optional)`, colors.reset);
    }
  }
  
  // Summary
  log('\n' + '='.repeat(50), colors.bright);
  if (hasErrors) {
    log('❌ Verification FAILED - Missing required variables!', colors.red + colors.bright);
    log('\n💡 Tip: Create a .env file or set environment variables:', colors.yellow);
    log('   See ENV.md for documentation', colors.yellow);
    return false;
  } else if (hasWarnings && !isProduction) {
    log('⚠️  Verification PASSED with warnings', colors.yellow);
    log('\n💡 Tip: Set required variables before deploying to production', colors.yellow);
    return true;
  } else {
    log('✅ Verification PASSED', colors.green + colors.bright);
    return true;
  }
}

// Run verification
const passed = verifyEnv();
process.exit(passed ? 0 : 1);

