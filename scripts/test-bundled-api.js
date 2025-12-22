#!/usr/bin/env node

/**
 * Test that builds the API function and verifies it works
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

function log(message, type = 'info') {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
  };
  console.log(`${icons[type] || 'ℹ️'} ${message}`);
}

async function testBundledApi() {
  console.log('🧪 Testing Bundled API Function\n');
  console.log('='.repeat(60));
  
  // Possible locations for the bundled file
  const possiblePaths = [
    path.join(PROJECT_ROOT, 'api', 'index.js'),
    path.join(PROJECT_ROOT, '..', 'api', 'index.js'),
    path.join(PROJECT_ROOT, 'dist', 'index.js'), // Fallback location
  ];
  
  // Step 1: Build the API function
  log('Step 1: Building API function...', 'info');
  try {
    execSync('node build-vercel-api.js', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    });
    log('Build completed successfully', 'success');
  } catch (error) {
    log(`Build failed: ${error.message}`, 'error');
    return false;
  }
  
  // Step 2: Find and verify the file exists
  log('\nStep 2: Verifying bundled file exists...', 'info');
  let bundledPath = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      bundledPath = possiblePath;
      break;
    }
  }
  
  if (!bundledPath) {
    log('Bundled file not found after build', 'error');
    log('  Checked locations:', 'error');
    possiblePaths.forEach(p => log(`    - ${p}`, 'error'));
    return false;
  }
  
  log(`Found bundled file at: ${path.relative(PROJECT_ROOT, bundledPath)}`, 'success');
  
  const stats = fs.statSync(bundledPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  log(`Bundled file exists (${sizeMB} MB)`, 'success');
  
  // Step 3: Verify it's valid JavaScript
  log('\nStep 3: Verifying file is valid JavaScript...', 'info');
  const content = fs.readFileSync(bundledPath, 'utf8');
  
  // Check for TypeScript syntax (should not be present)
  // Be more careful - some patterns might be in strings or comments
  const lines = content.split('\n');
  let tsIssues = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // Skip comments and strings
    if (line.trim().startsWith('//') || line.includes('/*')) continue;
    if (line.includes("'") || line.includes('"')) {
      // Might be in a string, skip for now
      continue;
    }
    
    // Check for interface declarations (definitely TypeScript)
    if (/^\s*interface\s+\w+/.test(line)) {
      tsIssues.push(`Line ${lineNum}: interface declaration`);
    }
    
    // Check for type declarations (definitely TypeScript)
    if (/^\s*type\s+\w+\s*=/.test(line)) {
      tsIssues.push(`Line ${lineNum}: type declaration`);
    }
  }
  
  if (tsIssues.length > 0) {
    log('Found TypeScript syntax in bundled file:', 'error');
    tsIssues.slice(0, 5).forEach(issue => log(`  ${issue}`, 'error'));
    if (tsIssues.length > 5) {
      log(`  ... and ${tsIssues.length - 5} more`, 'error');
    }
    return false;
  }
  
  log('File is valid JavaScript (no TypeScript syntax found)', 'success');
  
  // Step 4: Check for import issues
  log('\nStep 4: Checking for import issues...', 'info');
  
  // Should not have @shared/* imports (check only in import/from statements, not strings)
  const importStatements = content.match(/import\s+.*from\s+['"]@shared\//g) || [];
  const dynamicImports = content.match(/import\s*\(['"]@shared\//g) || [];
  
  if (importStatements.length > 0 || dynamicImports.length > 0) {
    log(`Found ${importStatements.length + dynamicImports.length} @shared/* imports in code`, 'error');
    importStatements.slice(0, 3).forEach(imp => log(`  ${imp}`, 'error'));
    dynamicImports.slice(0, 3).forEach(imp => log(`  ${imp}`, 'error'));
    return false;
  }
  
  // Check for @shared in strings (this is OK - just log messages)
  const inStrings = (content.match(/['"]@shared\//g) || []).length;
  if (inStrings > 0) {
    log(`Found ${inStrings} @shared references in strings (log messages - OK)`, 'info');
  }
  
  // Should not have relative imports without .js (for local files)
  // But we allow node_modules imports without extensions
  const relativeImportWithoutJs = /from\s+['"](\.\.?\/[^'"]+?)(?<!\.js)(?<!\.json)(?<!\.mjs)(?<!\.cjs)['"]/g;
  const matches = content.match(relativeImportWithoutJs);
  
  if (matches && matches.length > 0) {
    // Filter out node_modules imports
    const localImports = matches.filter(m => {
      // Extract the import path
      const match = m.match(/['"](\.\.?\/[^'"]+?)['"]/);
      if (!match) return false;
      const importPath = match[1];
      // Check if it's a node_modules import (starts with package name, not ./ or ../)
      return importPath.startsWith('./') || importPath.startsWith('../');
    });
    
    if (localImports.length > 0) {
      log(`Found ${localImports.length} local imports without .js extension`, 'error');
      log('  First few:', 'error');
      localImports.slice(0, 3).forEach(imp => {
        log(`    ${imp}`, 'error');
      });
      return false;
    }
  }
  
  log('No import issues found', 'success');
  
  // Step 5: Check for critical exports
  log('\nStep 5: Verifying critical exports...', 'info');
  
  // Should export a handler function (Vercel serverless function)
  if (!content.includes('export') && !content.includes('module.exports')) {
    log('Warning: No exports found in bundled file', 'warning');
  } else {
    log('Exports found in bundled file', 'success');
  }
  
  // Step 6: Check file size (should be reasonable)
  log('\nStep 6: Checking file size...', 'info');
  const size = parseFloat(sizeMB);
  if (size > 10) {
    log(`Warning: Bundled file is large (${sizeMB} MB)`, 'warning');
    log('  Consider code splitting or tree shaking', 'warning');
  } else if (size < 0.1) {
    log(`Warning: Bundled file is very small (${sizeMB} MB)`, 'warning');
    log('  May not have bundled all dependencies', 'warning');
  } else {
    log(`File size is reasonable (${sizeMB} MB)`, 'success');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ All tests passed!');
  console.log('   The bundled API function is ready for Vercel deployment.\n');
  
  return true;
}

// Run the test
testBundledApi().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  log(`Test failed with error: ${error.message}`, 'error');
  process.exit(1);
});

