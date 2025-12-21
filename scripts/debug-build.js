import { build } from 'esbuild';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

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

// Path alias plugin for esbuild
const aliasPlugin = {
  name: 'alias',
  setup(build) {
    build.onResolve({ filter: /^@shared\// }, (args) => {
      let resolvedPath = args.path.replace('@shared/', 'shared/');
      if (!resolvedPath.includes('.')) {
        resolvedPath += '.ts';
      }
      return {
        path: join(rootDir, resolvedPath),
        namespace: 'file',
      };
    });
  },
};

async function debugBuild() {
  log('\n' + '='.repeat(50), colors.bright);
  log('Build Debugging', colors.bright);
  log('='.repeat(50), colors.bright);

  log('\nStep 1: Checking build configuration...', colors.blue);
  
  // Check if build-server.js exists
  const buildServerPath = join(rootDir, 'build-server.js');
  if (existsSync(buildServerPath)) {
    log('✓ build-server.js found', colors.green);
    const buildServerContent = readFileSync(buildServerPath, 'utf-8');
    if (buildServerContent.includes('@shared')) {
      log('✓ Path alias plugin configured', colors.green);
    } else {
      log('⚠ Path alias plugin might be missing', colors.yellow);
    }
  } else {
    log('✗ build-server.js not found', colors.red);
  }

  log('\nStep 2: Testing esbuild configuration...', colors.blue);
  
  try {
    const result = await build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outdir: join(rootDir, 'dist-debug'),
      packages: 'external',
      plugins: [aliasPlugin],
      write: false, // Don't write files, just test
      logLevel: 'error',
    });

    log('✓ Build configuration is valid', colors.green);
    
    // Check output size
    if (result.outputFiles && result.outputFiles.length > 0) {
      const totalSize = result.outputFiles.reduce((sum, file) => sum + file.contents.length, 0);
      const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
      log(`  Output size: ${sizeMB} MB`, colors.blue);
      
      if (totalSize > 50 * 1024 * 1024) {
        log('  ⚠ Output is large (>50MB), may cause issues on Vercel', colors.yellow);
      }
    }
  } catch (error) {
    log(`✗ Build failed: ${error.message}`, colors.red);
    if (error.errors) {
      error.errors.forEach((err) => {
        log(`  ${err.text}`, colors.red);
        if (err.location) {
          log(`    at ${err.location.file}:${err.location.line}:${err.location.column}`, colors.yellow);
        }
      });
    }
    process.exit(1);
  }

  log('\nStep 3: Checking critical modules...', colors.blue);
  
  const criticalModules = [
    'shared/schema.ts',
    'server/storage.ts',
    'server/routes.ts',
    'server/auth.ts',
  ];

  for (const module of criticalModules) {
    const modulePath = join(rootDir, module);
    if (existsSync(modulePath)) {
      log(`✓ ${module} exists`, colors.green);
    } else {
      log(`✗ ${module} not found`, colors.red);
    }
  }

  log('\n' + '='.repeat(50), colors.bright);
  log('Build debugging completed!', colors.green + colors.bright);
  log('='.repeat(50) + '\n', colors.bright);
}

debugBuild().catch((error) => {
  log(`\n✗ Debug failed: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});

