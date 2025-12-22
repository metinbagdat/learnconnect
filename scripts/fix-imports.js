#!/usr/bin/env node

/**
 * Comprehensive import fixer for ESM compatibility
 * 
 * Fixes:
 * 1. Replaces @shared/* imports with relative paths
 * 2. Adds .js extensions to relative imports missing them
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SHARED_DIR = path.join(PROJECT_ROOT, 'shared');

// Files to process
const DIRS_TO_PROCESS = [
  path.join(PROJECT_ROOT, 'server'),
  path.join(PROJECT_ROOT, 'api'),
];

// Extensions to process
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Track changes
const changes = [];

/**
 * Calculate relative path from file to shared directory
 */
function getRelativePathToShared(filePath) {
  const fileDir = path.dirname(filePath);
  const relative = path.relative(fileDir, SHARED_DIR);
  // Normalize path separators for imports (use forward slashes)
  return relative.replace(/\\/g, '/') || '.';
}

/**
 * Check if a path is a relative import (starts with . or ..)
 */
function isRelativeImport(importPath) {
  return importPath.startsWith('./') || importPath.startsWith('../');
}

/**
 * Check if a path already has an extension
 */
function hasExtension(importPath) {
  return /\.(js|jsx|ts|tsx|json|mjs|cjs)$/.test(importPath);
}

/**
 * Add .js extension to relative import if missing
 */
function addJsExtension(importPath) {
  if (!isRelativeImport(importPath)) {
    return importPath; // Not a relative import
  }
  
  if (hasExtension(importPath)) {
    return importPath; // Already has extension
  }
  
  // Remove query string or hash if present
  const [pathPart, ...rest] = importPath.split(/[?#]/);
  const suffix = rest.length > 0 ? importPath.substring(pathPart.length) : '';
  
  // Add .js extension
  return pathPart + '.js' + suffix;
}

/**
 * Replace @shared/* imports with relative paths
 */
function replaceSharedImport(importPath, filePath) {
  if (!importPath.startsWith('@shared/')) {
    return importPath;
  }
  
  // Get the path after @shared/
  const sharedPath = importPath.replace('@shared/', '');
  
  // Calculate relative path from file to shared directory
  const relativeToShared = getRelativePathToShared(filePath);
  
  // Build the new import path
  const newPath = path.join(relativeToShared, sharedPath).replace(/\\/g, '/');
  
  // Ensure it starts with ./ or ../ for relative imports
  let finalPath = newPath;
  if (!finalPath.startsWith('./') && !finalPath.startsWith('../')) {
    finalPath = './' + finalPath;
  }
  
  // Add .js extension if it's a TypeScript file reference
  if (!hasExtension(finalPath) && !finalPath.endsWith('/')) {
    finalPath = addJsExtension(finalPath);
  }
  
  return finalPath;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let fileChanged = false;
  
  // Pattern to match import/export statements
  const importPatterns = [
    // import ... from "..."
    /(import\s+(?:[^'"]*from\s+)?['"])([^'"]+)(['"])/g,
    // export ... from "..."
    /(export\s+(?:[^'"]*from\s+)?['"])([^'"]+)(['"])/g,
    // require("...")
    /(require\s*\(\s*['"])([^'"]+)(['"]\s*\))/g,
  ];
  
  importPatterns.forEach(pattern => {
    newContent = newContent.replace(pattern, (match, prefix, importPath, suffix) => {
      let newImportPath = importPath;
      let changed = false;
      
      // Fix @shared/* imports
      if (importPath.startsWith('@shared/')) {
        const oldPath = importPath;
        newImportPath = replaceSharedImport(importPath, filePath);
        if (newImportPath !== oldPath) {
          changed = true;
          changes.push({
            file: path.relative(PROJECT_ROOT, filePath),
            type: 'shared-import',
            old: oldPath,
            new: newImportPath,
          });
        }
      }
      
      // Fix missing .js extensions on relative imports
      if (isRelativeImport(newImportPath) && !hasExtension(newImportPath)) {
        const oldPath = newImportPath;
        newImportPath = addJsExtension(newImportPath);
        if (newImportPath !== oldPath) {
          changed = true;
          changes.push({
            file: path.relative(PROJECT_ROOT, filePath),
            type: 'missing-extension',
            old: oldPath,
            new: newImportPath,
          });
        }
      }
      
      if (changed) {
        fileChanged = true;
      }
      
      return prefix + newImportPath + suffix;
    });
  });
  
  if (fileChanged) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  }
  
  return false;
}

/**
 * Recursively find all TypeScript/JavaScript files
 */
function findFiles(dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip node_modules, .git, dist, build, etc.
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build', '.next', '.vercel'].includes(entry.name)) {
        continue;
      }
      files.push(...findFiles(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (EXTENSIONS.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning for files to fix...\n');
  
  const allFiles = [];
  DIRS_TO_PROCESS.forEach(dir => {
    if (fs.existsSync(dir)) {
      allFiles.push(...findFiles(dir));
    }
  });
  
  console.log(`Found ${allFiles.length} files to check\n`);
  
  let filesChanged = 0;
  
  for (const file of allFiles) {
    try {
      if (processFile(file)) {
        filesChanged++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n✅ Processing complete!`);
  console.log(`   Files changed: ${filesChanged}`);
  console.log(`   Total changes: ${changes.length}\n`);
  
  if (changes.length > 0) {
    console.log('📋 Summary of changes:\n');
    
    // Group by file
    const byFile = {};
    changes.forEach(change => {
      if (!byFile[change.file]) {
        byFile[change.file] = [];
      }
      byFile[change.file].push(change);
    });
    
    Object.keys(byFile).forEach(file => {
      console.log(`  ${file}:`);
      byFile[file].forEach(change => {
        const typeLabel = change.type === 'shared-import' ? '🔗 @shared' : '📄 .js ext';
        console.log(`    ${typeLabel} ${change.old} → ${change.new}`);
      });
      console.log('');
    });
  }
}

// Run the script
main();

