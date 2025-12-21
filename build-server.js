import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Path alias plugin for esbuild
 * 
 * This plugin resolves TypeScript path aliases (like @shared/*) to their actual file paths.
 * esbuild doesn't understand tsconfig.json path mappings by default, so we need this plugin.
 */
const aliasPlugin = {
  name: 'alias',
  setup(build) {
    // Handle @shared/* imports (e.g., @shared/schema -> shared/schema.ts)
    build.onResolve({ filter: /^@shared\// }, (args) => {
      // Replace the alias prefix with the actual directory path
      let resolvedPath = args.path.replace('@shared/', 'shared/');
      
      // Add .ts extension if no extension is provided
      // This is needed because TypeScript allows imports without extensions,
      // but esbuild needs explicit file paths
      if (!path.extname(resolvedPath)) {
        resolvedPath += '.ts';
      }
      
      return {
        path: path.resolve(__dirname, resolvedPath),
        namespace: 'file', // Use the default file namespace
      };
    });
  },
};

/**
 * Builds the server code using esbuild
 * 
 * This function bundles all server TypeScript files into a single ESM file
 * that can be run with Node.js in production.
 */
async function buildServer() {
  const startTime = Date.now();
  
  try {
    await build({
      // entryPoints: Array of entry files to bundle
      // esbuild will start from these files and recursively bundle all imports
      entryPoints: ['server/index.ts'],
      
      // bundle: true = Bundle all dependencies into the output file
      // false would only transpile the entry file without bundling
      bundle: true,
      
      // platform: 'node' = Target Node.js environment
      // Use 'browser' for client-side code, 'neutral' for universal code
      platform: 'node',
      
      // target: JavaScript version to compile to
      // 'node20' uses modern Node.js 20 features, ensures compatibility
      // Could also use: 'node18', 'es2022', 'esnext', etc.
      target: 'node20',
      
      // format: Output module format
      // 'esm' = ES Modules (import/export) - required for "type": "module" in package.json
      // 'cjs' = CommonJS (require/module.exports)
      // 'iife' = Immediately Invoked Function Expression (for browsers)
      format: 'esm',
      
      // outdir: Output directory for built files
      // Files will be written to dist/index.js (matches entry point name)
      outdir: 'dist',
      
      // packages: 'external' = Don't bundle node_modules packages
      // They remain as external dependencies (installed via npm install)
      // This keeps the bundle smaller and faster to build
      // Alternatives: 'bundle' (bundle everything) or provide array of package names
      packages: 'external',
      
      // plugins: Array of esbuild plugins to use
      // Our aliasPlugin handles @shared/* path resolution
      plugins: [aliasPlugin],
      
      // sourcemap: Generate source maps for debugging
      // 'linked' = Creates separate .map files that reference original TypeScript files
      // Useful for debugging production builds
      // Alternatives: true (inline source maps), false (no source maps)
      sourcemap: 'linked',
      
      // minify: Minify the output (disabled for server code)
      // Minification reduces file size but makes debugging harder
      // Usually disabled for server code, enabled for client bundles
      minify: false,
      
      // logLevel: Control esbuild's logging verbosity
      // 'info' = Show summary information about the build
      // Options: 'verbose', 'debug', 'info', 'warning', 'error', 'silent'
      logLevel: 'info',
      
      // banner: Text to prepend to the output file
      // This allows CommonJS require() to work in ESM context
      // Needed for packages that use require() internally (like some native modules)
      banner: {
        js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
      },
      
      // metafile: Generate metadata about the build (optional, for analysis)
      // Set to true if you want to analyze bundle size/dependencies
      metafile: false,
      
      // treeShaking: Remove unused code (enabled by default when bundle: true)
      // Helps reduce bundle size by eliminating dead code
      treeShaking: true,
      
      // keepNames: Preserve function/variable names in minified output
      // Useful for better error stack traces
      keepNames: true,
      
      // legalComments: What to do with license comments
      // 'none' = Remove all comments, 'inline' = Keep in code, 'eof' = Move to end
      legalComments: 'inline',
    });
    
    const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✓ Server build completed in ${buildTime}s`);
    console.log(`  Output: dist/index.js`);
  } catch (error) {
    console.error('✗ Server build failed:');
    console.error(error);
    process.exit(1);
  }
}

// Execute the build
buildServer();
