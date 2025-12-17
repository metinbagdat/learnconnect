#!/usr/bin/env node
/**
 * Database Connection String Verification Script
 * 
 * This script validates your DATABASE_URL format to prevent SSL errors.
 * Run: node verify-db-connection.js
 */

import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;

console.log('🔍 Verifying DATABASE_URL format...\n');

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL is not set!');
  console.error('\nPlease set DATABASE_URL in your .env file or environment variables.');
  process.exit(1);
}

console.log('✅ DATABASE_URL is set');
console.log(`   Format preview: ${DATABASE_URL.substring(0, 30)}...\n`);

// Validation checks
let hasErrors = false;
let hasWarnings = false;

// Check 1: Protocol
if (DATABASE_URL.startsWith('https://')) {
  console.error('❌ ERROR: DATABASE_URL starts with "https://"');
  console.error('   This will cause SSL_ERROR_RX_RECORD_TOO_LONG!');
  console.error('   ✅ Fix: Use "postgresql://" instead');
  console.error('   For Neon: Get the POOLER connection string from https://console.neon.tech/');
  hasErrors = true;
} else if (!DATABASE_URL.startsWith('postgresql://') && !DATABASE_URL.startsWith('postgres://')) {
  console.error('❌ ERROR: DATABASE_URL must start with "postgresql://" or "postgres://"');
  console.error(`   Current start: ${DATABASE_URL.substring(0, 20)}`);
  hasErrors = true;
} else {
  console.log('✅ Protocol is correct (postgresql://)');
}

// Check 2: Neon-specific checks
const isNeon = DATABASE_URL.includes('neon.tech');

if (isNeon) {
  console.log('\n🔵 Detected Neon database connection');
  
  // Check for pooler
  const hasPooler = DATABASE_URL.includes('-pooler') || DATABASE_URL.includes(':5432');
  if (!hasPooler) {
    console.warn('⚠️  WARNING: This appears to be a DIRECT Neon connection');
    console.warn('   For @neondatabase/serverless driver, you MUST use the POOLER connection');
    console.warn('   Direct connections can cause SSL_ERROR_RX_RECORD_TOO_LONG errors');
    console.warn('   ✅ Fix: Get pooler connection from Neon Console → Connection Details → Pooler tab');
    hasWarnings = true;
  } else {
    console.log('✅ Using Neon pooler connection (correct for serverless driver)');
  }
  
  // Check for SSL mode
  if (!DATABASE_URL.includes('sslmode=')) {
    console.warn('⚠️  WARNING: Missing "?sslmode=require" parameter');
    console.warn('   Recommended format: postgresql://...?sslmode=require');
    hasWarnings = true;
  } else {
    console.log('✅ SSL mode is specified');
  }
}

// Check 3: Basic format validation
try {
  const url = new URL(DATABASE_URL);
  if (!url.hostname) {
    console.error('❌ ERROR: Missing hostname in connection string');
    hasErrors = true;
  } else {
    console.log(`✅ Hostname found: ${url.hostname}`);
  }
  
  if (!url.pathname || url.pathname === '/') {
    console.warn('⚠️  WARNING: Database name might be missing');
    hasWarnings = true;
  } else {
    console.log(`✅ Database name: ${url.pathname.substring(1)}`);
  }
} catch (error) {
  console.error('❌ ERROR: Invalid URL format');
  console.error(`   Error: ${error.message}`);
  hasErrors = true;
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('\n❌ VALIDATION FAILED - Fix errors above before deploying');
  console.error('\n📖 See FIX_SSL_ERROR.md for detailed instructions');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('\n⚠️  VALIDATION PASSED WITH WARNINGS');
  console.warn('   Review warnings above - they may cause issues in production');
  process.exit(0);
} else {
  console.log('\n✅ VALIDATION PASSED - Connection string format looks good!');
  console.log('   Your DATABASE_URL should work correctly with the Neon serverless driver');
  process.exit(0);
}

