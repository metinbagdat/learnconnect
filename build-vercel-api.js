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
  
  try {
    // Output to api/index.js so Vercel can find it
    const apiDir = path.join(PROJECT_ROOT, 'api');
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
    }
    
    await build({
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
    
    const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Vercel API build completed in ${buildTime}s`);
    console.log(`   Output: api/index.js`);
    console.log(`\n📝 Note: Vercel will use this pre-built JavaScript file instead of bundling TypeScript`);
    console.log(`   All imports are bundled - no runtime module resolution needed!`);
  } catch (error) {
    console.error('❌ Vercel API build failed:');
    console.error(error);
    process.exit(1);
  }
}

// Execute the build
buildVercelAPI();

