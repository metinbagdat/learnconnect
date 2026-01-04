#!/usr/bin/env node

/**
 * Pre-build the Vercel API function with esbuild
 * This ensures .js extensions are preserved before Vercel's bundler processes it
 */

import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Path alias plugin for esbuild
 * Resolves @shared/* to relative paths with .js extensions
 */
const aliasPlugin = {
  name: 'alias',
  setup(build) {
    // Handle @shared/* imports - resolve to actual file paths
    build.onResolve({ filter: /^@shared\// }, (args) => {
      const sharedPath = args.path.replace('@shared/', 'shared/');
      const fullPath = path.resolve(PROJECT_ROOT, sharedPath);
      
      // Check if file exists with .ts extension
      const tsPath = fullPath + '.ts';
      if (fs.existsSync(tsPath)) {
        return {
          path: tsPath,
          namespace: 'file',
        };
      }
      
      // Check if file exists with .js extension
      const jsPath = fullPath + '.js';
      if (fs.existsSync(jsPath)) {
        return {
          path: jsPath,
          namespace: 'file',
        };
      }
      
      // If no extension, try both
      if (fs.existsSync(fullPath + '.ts')) {
        return {
          path: fullPath + '.ts',
          namespace: 'file',
        };
      }
      
      console.warn(`⚠️  Warning: Could not resolve @shared import: ${args.path}`);
      return {
        path: fullPath,
        namespace: 'file',
      };
    });
    
    // Ensure all relative imports preserve .js extensions
    build.onResolve({ filter: /^\.\.?\/.*/ }, (args) => {
      const importPath = args.path;
      
      // If it already has an extension, keep it
      if (/\.(js|ts|json|mjs|cjs)$/.test(importPath)) {
        return undefined; // Let esbuild handle it normally
      }
      
      // For relative imports without extension, try to resolve
      const fileDir = path.dirname(args.importer);
      const resolvedPath = path.resolve(fileDir, importPath);
      
      // Try .ts first (source files)
      if (fs.existsSync(resolvedPath + '.ts')) {
        return {
          path: resolvedPath + '.ts',
          namespace: 'file',
        };
      }
      
      // Try .js (compiled files)
      if (fs.existsSync(resolvedPath + '.js')) {
        return {
          path: resolvedPath + '.js',
          namespace: 'file',
        };
      }
      
      // Default: let esbuild handle it
      return undefined;
    });
  },
};

/**
 * Build the Vercel API function
 */
async function buildVercelAPI() {
  const startTime = Date.now();
  
  console.log('🔨 Building Vercel API function...\n');
  
  // Pre-build checks
  const entryPoint = path.resolve(PROJECT_ROOT, 'api/index.ts');
  
  // Check if entry point exists - skip build if not found (optional)
  if (!fs.existsSync(entryPoint)) {
    console.log('⏭️  Skipping Vercel API build - api/index.ts not found');
    console.log('   This is normal if you\'re not using Vercel API routes');
    return;
  }
  
  // Ensure output directory exists
  const apiDir = path.join(PROJECT_ROOT, 'api');
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
    console.log('   Created api directory');
  }
  
  try {
    const result = await build({
      entryPoints: ['api/index.ts'],
      bundle: true, // Bundle everything into a single file - no runtime imports!
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outfile: path.join(apiDir, 'index.js'),
      packages: 'external', // Don't bundle node_modules (they're installed separately)
      plugins: [aliasPlugin],
      sourcemap: 'linked',
      minify: false,
      logLevel: 'info',
      banner: {
        js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
      },
      keepNames: true,
      legalComments: 'inline',
      // Bundle all local files - this means no runtime imports, so no extension issues!
      // packages: 'external' automatically handles node_modules
    });
    
    // Post-build validation
    const outputFile = path.join(apiDir, 'index.js');
    if (!fs.existsSync(outputFile)) {
      throw new Error(`Build completed but output file not found: ${outputFile}`);
    }
    
    const stats = fs.statSync(outputFile);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    if (stats.size === 0) {
      throw new Error('Build output file is empty!');
    }
    
    // Vercel has a 50MB function size limit (compressed)
    if (parseFloat(fileSizeMB) > 45) {
      console.warn(`   ⚠️  Warning: Output file is very large (${fileSizeMB} MB)`);
      console.warn(`   Vercel functions must be under 50MB compressed. Consider optimizing.`);
    }
    
    const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Vercel API build completed in ${buildTime}s`);
    console.log(`   Output: api/index.js (${fileSizeMB} MB)`);
    console.log(`\n📝 Note: Vercel will use this pre-built JavaScript file instead of bundling TypeScript`);
    console.log(`   All imports are bundled - no runtime module resolution needed!`);
  } catch (error) {
    console.error('\n❌ Vercel API build failed:\n');
    
    // Enhanced error reporting
    if (error.errors && Array.isArray(error.errors)) {
      error.errors.forEach((err, index) => {
        console.error(`  Error ${index + 1}:`);
        console.error(`    ${err.text}`);
        if (err.location) {
          console.error(`    Location: ${err.location.file}:${err.location.line}:${err.location.column}`);
          if (err.location.lineText) {
            console.error(`    Code: ${err.location.lineText}`);
          }
        }
        console.error('');
      });
    } else {
      console.error(`  ${error.message || error}`);
      if (error.stack) {
        console.error('\n  Stack trace:');
        console.error(`  ${error.stack.split('\n').slice(0, 5).join('\n  ')}`);
      }
    }
    
    console.error('\n💡 Tip: Check that all dependencies are installed: npm install');
    console.error('💡 Tip: Verify TypeScript types: npm run check');
    console.error('💡 Tip: Ensure api/index.ts exists and exports the handler function');
    process.exit(1);
  }
}

// Execute the build
buildVercelAPI();

