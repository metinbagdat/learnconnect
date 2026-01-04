#!/usr/bin/env node

/**
 * Verify No Server-Only Imports in Frontend Code
 * 
 * Checks that frontend code doesn't import server-only packages
 * that could cause build failures or bundle bloat.
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const clientDir = join(rootDir, 'client/src');

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

// Server-only packages that should NEVER be imported in frontend
const SERVER_ONLY_PACKAGES = [
  'fs',
  'path',
  'crypto',
  'ws',
  'bufferutil',
  'tls',
  'net',
  'http',
  'https',
  'stream',
  'util',
  'os',
  'url',
  'querystring',
  'express',
  'openai',
  '@anthropic-ai/sdk',
  'drizzle-orm',
  '@neondatabase/serverless',
  'pg',
  'connect-pg-simple',
  'express-session',
  'passport',
  'passport-local',
  'dotenv',
  '@paypal/paypal-server-sdk',
  'stripe',
];

// Server-only files/modules that should NEVER be imported in frontend
const SERVER_ONLY_MODULES = [
  '../server/ai-reasoning-engine',
  '../server/ai-reasoning-engine.js',
  '../../server/ai-reasoning-engine',
  '../../server/ai-reasoning-engine.js',
  '@/server/ai-reasoning-engine',
  '@/server/ai-reasoning-engine.js',
  'server/ai-reasoning-engine',
  'server/ai-reasoning-engine.js',
  './ai-reasoning-engine',
  './ai-reasoning-engine.js',
];

// Patterns to check for imports
const IMPORT_PATTERNS = [
  /import\s+.*\s+from\s+['"]([^'"]+)['"]/g,
  /import\s+['"]([^'"]+)['"]/g,
  /require\(['"]([^'"]+)['"]\)/g,
];

function getAllTsFiles(dir, fileList = []) {
  try {
    const files = readdirSync(dir);

    files.forEach((file) => {
      const filePath = join(dir, file);
      const stat = statSync(filePath);

      if (stat.isDirectory()) {
        // Skip node_modules and dist
        if (!['node_modules', 'dist', '.git', '.next'].includes(file)) {
          getAllTsFiles(filePath, fileList);
        }
      } else if (
        (file.endsWith('.ts') || file.endsWith('.tsx')) && 
        !file.endsWith('.d.ts')
      ) {
        fileList.push(filePath);
      }
    });
  } catch (error) {
    // Directory doesn't exist or can't be read
  }

  return fileList;
}

function checkImports(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const issues = [];

  for (const pattern of IMPORT_PATTERNS) {
    let match;
    // Reset regex lastIndex to avoid issues with global regex
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(content)) !== null) {
      const importPath = match[1];
      
      // Check if it's a server-only package
      for (const serverPackage of SERVER_ONLY_PACKAGES) {
        if (
          importPath === serverPackage ||
          importPath.startsWith(`${serverPackage}/`) ||
          importPath.startsWith(`node:${serverPackage}`)
        ) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          issues.push({
            type: 'server_package',
            package: serverPackage,
            import: importPath,
            line: lineNumber,
          });
        }
      }
      
      // Check if it's a server-only module/file (e.g., ai-reasoning-engine)
      for (const serverModule of SERVER_ONLY_MODULES) {
        if (
          importPath === serverModule ||
          importPath.includes('ai-reasoning-engine') ||
          importPath.includes('aiReasoningEngine') ||
          importPath.includes('AIReasoningEngine')
        ) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          issues.push({
            type: 'server_module',
            package: 'ai-reasoning-engine',
            import: importPath,
            line: lineNumber,
          });
          break; // Avoid duplicate entries
        }
      }
    }
  }

  return issues;
}

async function main() {
  log('\n' + '='.repeat(50), colors.bright);
  log('Frontend Server-Only Import Verification', colors.bright);
  log('='.repeat(50), colors.bright);

  const files = getAllTsFiles(clientDir);

  log(`\nChecking ${files.length} frontend files...\n`, colors.blue);

  let totalIssues = 0;
  const filesWithIssues = [];

  files.forEach((filePath) => {
    const issues = checkImports(filePath);
    if (issues.length > 0) {
      totalIssues += issues.length;
      filesWithIssues.push({ filePath, issues });
    }
  });

  if (filesWithIssues.length === 0) {
    log('✅ No server-only imports found in frontend code!', colors.green);
    log('\n' + '='.repeat(50) + '\n', colors.bright);
    return true;
  }

  log(`\n❌ Found ${totalIssues} server-only import(s) in ${filesWithIssues.length} file(s):\n`, colors.red);

  filesWithIssues.forEach(({ filePath, issues }) => {
    const relativePath = relative(rootDir, filePath);
    log(`\n📄 ${relativePath}:`, colors.blue);

    issues.forEach((issue) => {
      log(`  Line ${issue.line}:`, colors.red);
      log(`    Type: ${issue.type === 'server_package' ? 'Server Package' : 'Server Module'}`, colors.yellow);
      log(`    Package: ${issue.package}`, colors.yellow);
      log(`    Import: ${issue.import}`, colors.yellow);
      if (issue.type === 'server_module' && issue.package === 'ai-reasoning-engine') {
        log(`    ❌ ai-reasoning-engine contains @anthropic-ai/sdk and must not be imported in frontend!`, colors.red);
        log(`    💡 Use API endpoints (/api/ai/adaptive-plan) instead`, colors.yellow);
      } else {
        log(`    ❌ This is a server-only package and should not be used in frontend!`, colors.red);
      }
    });
  });

  log('\n💡 Recommendation:', colors.yellow);
  log('   - Remove these imports from frontend code', colors.yellow);
  log('   - Use API endpoints to access server functionality instead', colors.yellow);
  log('   - If you need types, create separate type-only imports', colors.yellow);

  log('\n' + '='.repeat(50) + '\n', colors.bright);
  return false;
}

// Execute
main()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((error) => {
    log(`\n❌ Verification failed: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  });

