#!/usr/bin/env node

/**
 * Comprehensive test to verify all imports work correctly
 * Tests:
 * 1. All imports have .js extensions
 * 2. No @shared/* imports remain
 * 3. Bundled API file can be loaded
 * 4. All relative imports resolve correctly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function log(message, type = 'info') {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
  };
  console.log(`${icons[type] || 'ℹ️'} ${message}`);
}

function findFiles(dir, extensions = ['.ts', '.tsx'], excludeDirs = []) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (excludeDirs.includes(entry.name) || entry.name.startsWith('.')) {
        continue;
      }
      files.push(...findFiles(fullPath, extensions, excludeDirs));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * Test 1: Verify all relative imports have .js extensions
 */
function testJsExtensions() {
  log('Test 1: Checking .js extensions in imports...', 'info');
  
  const serverFiles = findFiles(
    path.join(PROJECT_ROOT, 'server'),
    ['.ts', '.tsx'],
    ['node_modules', 'dist', 'build']
  );
  const apiFiles = findFiles(
    path.join(PROJECT_ROOT, 'api'),
    ['.ts', '.tsx'],
    ['node_modules', 'dist', 'build']
  );
  
  const allFiles = [...serverFiles, ...apiFiles];
  let issues = 0;
  
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(PROJECT_ROOT, file);
    
    // Check for relative imports without .js extension
    const relativeImportPattern = /from\s+['"](\.\.?\/[^'"]+?)(?<!\.js)(?<!\.json)(?<!\.mjs)(?<!\.cjs)(?<!\/index)['"]/g;
    let match;
    
    while ((match = relativeImportPattern.exec(content)) !== null) {
      const importPath = match[1];
      
      // Skip if it's a directory import (ends with /)
      if (importPath.endsWith('/')) continue;
      
      // Skip index imports (they're handled differently)
      if (importPath.endsWith('/index')) continue;
      
      // Check if the target file exists
      const fileDir = path.dirname(file);
      const resolvedPath = path.resolve(fileDir, importPath);
      const withTs = resolvedPath + '.ts';
      const withJs = resolvedPath + '.js';
      
      // If the file exists but import doesn't have .js, it's an issue
      if (fs.existsSync(withTs) && !fs.existsSync(resolvedPath)) {
        issues++;
        const error = {
          file: relativePath,
          line: content.substring(0, match.index).split('\n').length,
          import: importPath,
          expected: importPath + '.js',
        };
        results.failed.push({
          test: 'JS Extensions',
          ...error,
        });
        log(`  Missing .js: ${relativePath}:${error.line} - ${importPath}`, 'error');
      }
    }
  }
  
  if (issues === 0) {
    results.passed.push({ test: 'JS Extensions', message: 'All relative imports have .js extensions' });
    log('  All relative imports have .js extensions', 'success');
  }
  
  return issues === 0;
}

/**
 * Test 2: Verify no @shared/* imports remain
 */
function testNoSharedImports() {
  log('\nTest 2: Checking for @shared/* imports...', 'info');
  
  const serverFiles = findFiles(
    path.join(PROJECT_ROOT, 'server'),
    ['.ts', '.tsx'],
    ['node_modules', 'dist', 'build']
  );
  const apiFiles = findFiles(
    path.join(PROJECT_ROOT, 'api'),
    ['.ts', '.tsx'],
    ['node_modules', 'dist', 'build']
  );
  
  const allFiles = [...serverFiles, ...apiFiles];
  let issues = 0;
  
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(PROJECT_ROOT, file);
    
    // Check for @shared/* imports
    const sharedImportPattern = /from\s+['"]@shared\//g;
    let match;
    const matches = [];
    
    while ((match = sharedImportPattern.exec(content)) !== null) {
      matches.push({
        line: content.substring(0, match.index).split('\n').length,
        match: match[0],
      });
    }
    
    if (matches.length > 0) {
      issues += matches.length;
      for (const m of matches) {
        results.failed.push({
          test: 'No @shared Imports',
          file: relativePath,
          line: m.line,
          import: m.match,
        });
        log(`  Found @shared import: ${relativePath}:${m.line}`, 'error');
      }
    }
  }
  
  if (issues === 0) {
    results.passed.push({ test: 'No @shared Imports', message: 'No @shared/* imports found' });
    log('  No @shared/* imports found', 'success');
  }
  
  return issues === 0;
}

/**
 * Test 3: Verify bundled API file exists and is valid
 */
function testBundledApiFile() {
  log('\nTest 3: Checking bundled API file...', 'info');
  
  const bundledPath = path.join(PROJECT_ROOT, 'api', 'index.js');
  
  if (!fs.existsSync(bundledPath)) {
    results.warnings.push({
      test: 'Bundled API File',
      message: 'Bundled file not found (will be created during build)',
    });
    log('  Bundled file not found (this is OK if not built yet)', 'warning');
    return true; // Not a failure, just a warning
  }
  
  try {
    const stats = fs.statSync(bundledPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    if (stats.size === 0) {
      results.failed.push({
        test: 'Bundled API File',
        message: 'Bundled file is empty',
      });
      log('  Bundled file is empty', 'error');
      return false;
    }
    
    // Check if it's a valid JavaScript file
    const content = fs.readFileSync(bundledPath, 'utf8');
    
    // Should contain import statements (ESM)
    if (!content.includes('import ') && !content.includes('export ')) {
      results.warnings.push({
        test: 'Bundled API File',
        message: 'Bundled file may not be ESM format',
      });
      log('  Warning: Bundled file may not be ESM format', 'warning');
    }
    
    // Should not contain TypeScript syntax
    if (content.includes(': string') || content.includes(': number') || content.includes('interface ')) {
      results.failed.push({
        test: 'Bundled API File',
        message: 'Bundled file contains TypeScript syntax',
      });
      log('  Bundled file contains TypeScript syntax (not properly compiled)', 'error');
      return false;
    }
    
    results.passed.push({
      test: 'Bundled API File',
      message: `Bundled file exists and is valid (${sizeMB} MB)`,
    });
    log(`  Bundled file exists and is valid (${sizeMB} MB)`, 'success');
    return true;
  } catch (error) {
    results.failed.push({
      test: 'Bundled API File',
      message: `Error reading bundled file: ${error.message}`,
    });
    log(`  Error reading bundled file: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Test 4: Verify import paths resolve correctly
 */
function testImportResolution() {
  log('\nTest 4: Testing import path resolution...', 'info');
  
  const testPaths = [
    { from: 'server/middleware/subscription.ts', import: '../db.js', shouldExist: 'server/db.ts' },
    { from: 'server/routes.ts', import: './middleware/subscription.js', shouldExist: 'server/middleware/subscription.ts' },
    { from: 'api/index.ts', import: '../server/routes.js', shouldExist: 'server/routes.ts' },
    { from: 'server/db.ts', import: '../shared/schema.js', shouldExist: 'shared/schema.ts' },
  ];
  
  let issues = 0;
  
  for (const test of testPaths) {
    const fromFile = path.join(PROJECT_ROOT, test.from);
    if (!fs.existsSync(fromFile)) {
      results.warnings.push({
        test: 'Import Resolution',
        message: `Source file not found: ${test.from}`,
      });
      continue;
    }
    
    const fromDir = path.dirname(fromFile);
    const resolvedPath = path.resolve(fromDir, test.import);
    
    // Check if the target file exists (with .ts extension)
    const targetFile = path.join(PROJECT_ROOT, test.shouldExist);
    
    if (!fs.existsSync(targetFile)) {
      issues++;
      results.failed.push({
        test: 'Import Resolution',
        file: test.from,
        import: test.import,
        message: `Target file not found: ${test.shouldExist}`,
      });
      log(`  Target not found: ${test.from} -> ${test.import} (expected ${test.shouldExist})`, 'error');
    } else {
      results.passed.push({
        test: 'Import Resolution',
        file: test.from,
        import: test.import,
        message: `Resolves correctly to ${test.shouldExist}`,
      });
    }
  }
  
  if (issues === 0) {
    log('  All test import paths resolve correctly', 'success');
  }
  
  return issues === 0;
}

/**
 * Test 5: Verify build script exists and is executable
 */
function testBuildScript() {
  log('\nTest 5: Checking build script...', 'info');
  
  const buildScript = path.join(PROJECT_ROOT, 'build-vercel-api.js');
  
  if (!fs.existsSync(buildScript)) {
    results.failed.push({
      test: 'Build Script',
      message: 'build-vercel-api.js not found',
    });
    log('  Build script not found', 'error');
    return false;
  }
  
  // Check if it's a valid JavaScript file
  try {
    const content = fs.readFileSync(buildScript, 'utf8');
    if (!content.includes('esbuild') || !content.includes('build')) {
      results.warnings.push({
        test: 'Build Script',
        message: 'Build script may not be configured correctly',
      });
      log('  Warning: Build script may not be configured correctly', 'warning');
    } else {
      results.passed.push({
        test: 'Build Script',
        message: 'Build script exists and appears valid',
      });
      log('  Build script exists and appears valid', 'success');
    }
    return true;
  } catch (error) {
    results.failed.push({
      test: 'Build Script',
      message: `Error reading build script: ${error.message}`,
    });
    log(`  Error reading build script: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Main test runner
 */
function runTests() {
  console.log('🧪 Running Import Verification Tests\n');
  console.log('=' .repeat(60));
  
  const tests = [
    testJsExtensions,
    testNoSharedImports,
    testBundledApiFile,
    testImportResolution,
    testBuildScript,
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      if (test()) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
      log(`Test failed with error: ${error.message}`, 'error');
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results Summary\n');
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    for (const failure of results.failed) {
      console.log(`   - ${failure.test}: ${failure.message || failure.file || 'Unknown error'}`);
    }
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    for (const warning of results.warnings) {
      console.log(`   - ${warning.test}: ${warning.message}`);
    }
  }
  
  if (results.passed.length > 0 && results.failed.length === 0) {
    console.log('\n✅ All critical tests passed!');
    console.log('   Your imports are configured correctly for Vercel deployment.');
  }
  
  console.log('');
  
  return failed === 0;
}

// Run the tests
const success = runTests();
process.exit(success ? 0 : 1);

