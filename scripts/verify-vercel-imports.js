#!/usr/bin/env node

/**
 * Verify that all imports in server files have .js extensions
 * This is critical for Vercel's ESM bundler
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

function findFiles(dir, extensions = ['.ts', '.tsx']) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build', '.next', '.vercel'].includes(entry.name)) {
        continue;
      }
      files.push(...findFiles(fullPath, extensions));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

function checkImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check for relative imports without .js extension
  const relativeImportPattern = /from\s+['"](\.\.?\/[^'"]+?)(?<!\.js)(?<!\.json)(?<!\.mjs)(?<!\.cjs)['"]/g;
  let match;
  
  while ((match = relativeImportPattern.exec(content)) !== null) {
    const importPath = match[1];
    // Skip if it's a directory import (ends with /)
    if (importPath.endsWith('/')) continue;
    // Skip if it's an index file (we'll check those separately)
    if (importPath.endsWith('/index')) continue;
    
    // Check if the target file exists
    const fileDir = path.dirname(filePath);
    const resolvedPath = path.resolve(fileDir, importPath);
    const withJs = resolvedPath + '.js';
    const withTs = resolvedPath + '.ts';
    
    // If the file exists but import doesn't have .js, it's an issue
    if (fs.existsSync(withTs) && !fs.existsSync(resolvedPath)) {
      issues.push({
        line: content.substring(0, match.index).split('\n').length,
        import: importPath,
        expected: importPath + '.js',
        type: 'missing-extension'
      });
    }
  }
  
  // Check for @shared imports
  const sharedImportPattern = /from\s+['"]@shared\//g;
  if (sharedImportPattern.test(content)) {
    issues.push({
      line: 0,
      import: '@shared/*',
      expected: 'relative path with .js',
      type: 'shared-alias'
    });
  }
  
  return issues;
}

function main() {
  console.log('🔍 Verifying imports in server and api directories...\n');
  
  const serverFiles = findFiles(path.join(PROJECT_ROOT, 'server'));
  const apiFiles = findFiles(path.join(PROJECT_ROOT, 'api'));
  const allFiles = [...serverFiles, ...apiFiles];
  
  console.log(`Found ${allFiles.length} files to check\n`);
  
  let totalIssues = 0;
  const filesWithIssues = [];
  
  for (const file of allFiles) {
    const issues = checkImports(file);
    if (issues.length > 0) {
      totalIssues += issues.length;
      filesWithIssues.push({
        file: path.relative(PROJECT_ROOT, file),
        issues
      });
    }
  }
  
  if (totalIssues === 0) {
    console.log('✅ All imports are correct!\n');
    process.exit(0);
  } else {
    console.log(`❌ Found ${totalIssues} import issues:\n`);
    
    for (const { file, issues } of filesWithIssues) {
      console.log(`  ${file}:`);
      for (const issue of issues) {
        console.log(`    Line ${issue.line}: ${issue.import} → ${issue.expected}`);
      }
      console.log('');
    }
    
    process.exit(1);
  }
}

main();

