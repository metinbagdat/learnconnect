#!/usr/bin/env node
/**
 * Check for circular dependencies in client code
 * This helps identify the source of "Cannot access 'A' before initialization" errors
 */

import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const clientSrc = join(__dirname, '..', 'client', 'src');

const visited = new Set();
const visiting = new Set();
const cycles = [];

function extractImports(content, filePath) {
  const imports = [];
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    let resolvedPath = null;
    
    // Resolve relative imports
    if (importPath.startsWith('@/')) {
      resolvedPath = join(clientSrc, importPath.replace('@/', ''));
    } else if (importPath.startsWith('@shared/')) {
      resolvedPath = join(__dirname, '..', 'shared', importPath.replace('@shared/', ''));
    } else if (importPath.startsWith('.')) {
      const baseDir = dirname(filePath);
      resolvedPath = join(baseDir, importPath);
    }
    
    if (resolvedPath) {
      // Try to find the actual file
      const extensions = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'];
      for (const ext of extensions) {
        const fullPath = resolvedPath + ext;
        if (fullPath.startsWith(clientSrc)) {
          imports.push(fullPath);
          break;
        }
      }
    }
  }
  
  return imports;
}

async function checkFile(filePath, path = []) {
  if (visiting.has(filePath)) {
    const cycleStart = path.indexOf(filePath);
    if (cycleStart !== -1) {
      const cycle = [...path.slice(cycleStart), filePath];
      cycles.push(cycle);
      return;
    }
  }
  
  if (visited.has(filePath)) {
    return;
  }
  
  visiting.add(filePath);
  path.push(filePath);
  
  try {
    const content = await readFile(filePath, 'utf-8');
    const imports = extractImports(content, filePath);
    
    for (const importPath of imports) {
      if (importPath && importPath.startsWith(clientSrc)) {
        await checkFile(importPath, [...path]);
      }
    }
  } catch (error) {
    // File might not exist or be readable, skip
  }
  
  visiting.delete(filePath);
  visited.add(filePath);
  path.pop();
}

async function findCircularDependencies() {
  console.log('🔍 Checking for circular dependencies in client code...\n');
  
  async function scanDir(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        await scanDir(fullPath);
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
        await checkFile(fullPath);
      }
    }
  }
  
  await scanDir(clientSrc);
  
  if (cycles.length > 0) {
    console.log('❌ Found circular dependencies:\n');
    cycles.forEach((cycle, index) => {
      console.log(`Cycle ${index + 1}:`);
      cycle.forEach((file, i) => {
        const relativePath = file.replace(clientSrc + '\\', '').replace(clientSrc + '/', '');
        console.log(`  ${i + 1}. ${relativePath}`);
      });
      console.log('');
    });
    process.exit(1);
  } else {
    console.log('✅ No circular dependencies found!');
    console.log('\n💡 If you still see "Cannot access before initialization" errors:');
    console.log('   1. Clear browser cache and hard refresh (Ctrl+Shift+R)');
    console.log('   2. Delete dist/public folder and rebuild');
    console.log('   3. Check for hoisting issues with let/const declarations');
  }
}

findCircularDependencies().catch(console.error);

