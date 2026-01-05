#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Checks code for potential deployment issues before deploying
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = join(rootDir, filePath);
  if (existsSync(fullPath)) {
    log(`✓ ${description}`, colors.green);
    return true;
  } else {
    log(`✗ ${description} - NOT FOUND`, colors.red);
    return false;
  }
}

function checkCriticalEnvVars() {
  log('\n📋 Checking for critical environment variable requirements...', colors.blue);
  
  const criticalFiles = [
    'server/db.ts',
    'server/ai/ai-reasoning.engine.ts',
    'server/auth.ts',
  ];
  
  const issues = [];
  
  criticalFiles.forEach(file => {
    const fullPath = join(rootDir, file);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, 'utf-8');
      
      // Check for DATABASE_URL
      if (file.includes('db.ts') && content.includes('DATABASE_URL')) {
        if (content.includes('throw new Error') && content.includes('DATABASE_URL')) {
          issues.push({
            file,
            variable: 'DATABASE_URL',
            severity: 'CRITICAL',
            message: 'Server will fail to start without DATABASE_URL'
          });
        }
      }
      
      // Check for ANTHROPIC_API_KEY
      if (file.includes('ai-reasoning.engine.ts')) {
        if (content.includes('ANTHROPIC_API_KEY') && content.includes('throw new Error')) {
          issues.push({
            file,
            variable: 'ANTHROPIC_API_KEY',
            severity: 'CRITICAL',
            message: 'Server will fail to start without ANTHROPIC_API_KEY'
          });
        }
        if (content.includes('ANTHROPIC_MODEL') && content.includes('throw new Error')) {
          issues.push({
            file,
            variable: 'ANTHROPIC_MODEL',
            severity: 'CRITICAL',
            message: 'Server will fail to start without ANTHROPIC_MODEL'
          });
        }
      }
      
      // Check for SESSION_SECRET
      if (file.includes('auth.ts') && content.includes('SESSION_SECRET')) {
        if (content.includes('production') && content.includes('SESSION_SECRET')) {
          issues.push({
            file,
            variable: 'SESSION_SECRET',
            severity: 'WARNING',
            message: 'SESSION_SECRET should be set in production for security'
          });
        }
      }
    }
  });
  
  return issues;
}

function checkImportPaths() {
  log('\n📦 Checking import paths...', colors.blue);
  
  const filesToCheck = [
    'server/routes/ai-routes.ts',
    'server/routes.ts',
  ];
  
  const issues = [];
  
  filesToCheck.forEach(file => {
    const fullPath = join(rootDir, file);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, 'utf-8');
      const imports = content.match(/from\s+['"](.+?)['"]/g) || [];
      
      imports.forEach(imp => {
        const path = imp.match(/['"](.+?)['"]/)[1];
        // Check for server/ai imports
        if (path.includes('ai-reasoning') || path.includes('ai/ai-reasoning')) {
          const resolvedPath = join(rootDir, path.replace(/\.js$/, '.ts'));
          if (!existsSync(resolvedPath)) {
            issues.push({
              file,
              import: path,
              severity: 'ERROR',
              message: `Import path may be incorrect: ${path}`
            });
          }
        }
      });
    }
  });
  
  return issues;
}

async function main() {
  log('\n' + '='.repeat(60), colors.blue);
  log('Deployment Verification', colors.blue);
  log('='.repeat(60), colors.blue);
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // Check critical files exist
  log('\n📁 Checking critical files...', colors.blue);
  const filesOk = 
    checkFile('server/ai/ai-reasoning.engine.ts', 'AI reasoning engine') &&
    checkFile('server/routes/ai-routes.ts', 'AI routes') &&
    checkFile('server/middleware/rate-limiter.ts', 'Rate limiter middleware') &&
    checkFile('.env.example', 'Environment example file');
  
  if (!filesOk) {
    hasErrors = true;
  }
  
  // Check environment variables
  const envIssues = checkCriticalEnvVars();
  if (envIssues.length > 0) {
    log('\n⚠️  Environment Variable Requirements:', colors.yellow);
    envIssues.forEach(issue => {
      const color = issue.severity === 'CRITICAL' ? colors.red : colors.yellow;
      log(`  ${issue.severity}: ${issue.variable}`, color);
      log(`    File: ${issue.file}`, colors.reset);
      log(`    ${issue.message}`, colors.reset);
      if (issue.severity === 'CRITICAL') {
        hasErrors = true;
      } else {
        hasWarnings = true;
      }
    });
  }
  
  // Check import paths
  const importIssues = checkImportPaths();
  if (importIssues.length > 0) {
    log('\n❌ Import Path Issues:', colors.red);
    importIssues.forEach(issue => {
      log(`  ${issue.severity}: ${issue.file}`, colors.red);
      log(`    Import: ${issue.import}`, colors.reset);
      log(`    ${issue.message}`, colors.reset);
      hasErrors = true;
    });
  }
  
  // Summary
  log('\n' + '='.repeat(60), colors.blue);
  if (hasErrors) {
    log('❌ DEPLOYMENT WILL LIKELY FAIL', colors.red);
    log('\nPlease fix the errors above before deploying.', colors.yellow);
    log('Required environment variables must be set in Vercel:', colors.yellow);
    log('  - DATABASE_URL (CRITICAL)', colors.red);
    log('  - ANTHROPIC_API_KEY (CRITICAL)', colors.red);
    log('  - ANTHROPIC_MODEL (CRITICAL)', colors.red);
    log('  - SESSION_SECRET (WARNING - recommended)', colors.yellow);
    process.exit(1);
  } else if (hasWarnings) {
    log('⚠️  DEPLOYMENT READY WITH WARNINGS', colors.yellow);
    log('\nCheck warnings above. Deployment may work but some features may be limited.', colors.yellow);
    process.exit(0);
  } else {
    log('✅ CODE CHECKS PASSED', colors.green);
    log('\nCode structure looks good. Ensure environment variables are set in Vercel.', colors.green);
    process.exit(0);
  }
}

main().catch(error => {
  log(`\n❌ Verification failed: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});

