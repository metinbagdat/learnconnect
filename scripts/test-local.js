import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      ...options,
      shell: true,
      stdio: 'inherit',
      cwd: rootDir,
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

async function testServerStartup() {
  log('\n=== Testing Server Startup ===', colors.bright);
  
  try {
    // Try to import and verify server modules
    log('Checking module resolution...', colors.blue);
    
    try {
      await import('../server/routes.js');
      log('✓ server/routes.js imports successfully', colors.green);
    } catch (error) {
      log(`✗ Failed to import server/routes.js: ${error.message}`, colors.red);
      throw error;
    }

    try {
      await import('../server/storage.js');
      log('✓ server/storage.js imports successfully', colors.green);
    } catch (error) {
      log(`✗ Failed to import server/storage.js: ${error.message}`, colors.red);
      throw error;
    }

    try {
      await import('@shared/schema');
      log('✓ @shared/schema imports successfully', colors.green);
    } catch (error) {
      log(`✗ Failed to import @shared/schema: ${error.message}`, colors.red);
      throw error;
    }

    log('\n✓ All modules resolved successfully', colors.green);
    return true;
  } catch (error) {
    log(`\n✗ Module resolution failed: ${error.message}`, colors.red);
    return false;
  }
}

async function testAPIEndpoints() {
  log('\n=== Testing API Endpoints ===', colors.bright);
  
  // Start dev server in background
  log('Starting dev server...', colors.blue);
  const server = spawn('npm', ['run', 'dev'], {
    shell: true,
    stdio: 'pipe',
    cwd: rootDir,
  });

  let serverReady = false;
  const serverOutput = [];

  server.stdout.on('data', (data) => {
    const output = data.toString();
    serverOutput.push(output);
    process.stdout.write(output);
    
    if (output.includes('listening') || output.includes('ready')) {
      serverReady = true;
    }
  });

  server.stderr.on('data', (data) => {
    const output = data.toString();
    serverOutput.push(output);
    process.stderr.write(output);
  });

  // Wait for server to start (max 30 seconds)
  await new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (serverReady) {
        clearInterval(checkInterval);
        resolve(true);
      }
    }, 500);

    setTimeout(() => {
      clearInterval(checkInterval);
      resolve(false);
    }, 30000);
  });

  if (!serverReady) {
    log('✗ Server failed to start within 30 seconds', colors.red);
    server.kill();
    return false;
  }

  log('\n✓ Server started successfully', colors.green);

  // Test health endpoint
  try {
    log('Testing /api/health endpoint...', colors.blue);
    const response = await fetch('http://localhost:5000/api/health');
    if (response.ok) {
      const data = await response.json();
      log(`✓ /api/health returned: ${JSON.stringify(data)}`, colors.green);
    } else {
      log(`✗ /api/health returned status ${response.status}`, colors.red);
    }
  } catch (error) {
    log(`✗ Failed to test /api/health: ${error.message}`, colors.red);
  }

  // Cleanup
  server.kill();
  log('\n✓ Server stopped', colors.green);
  return true;
}

async function main() {
  log('\n' + '='.repeat(50), colors.bright);
  log('Local Server Testing', colors.bright);
  log('='.repeat(50), colors.bright);

  const moduleTest = await testServerStartup();
  if (!moduleTest) {
    process.exit(1);
  }

  // Uncomment to test API endpoints (requires server to be running)
  // const apiTest = await testAPIEndpoints();
  // if (!apiTest) {
  //   process.exit(1);
  // }

  log('\n' + '='.repeat(50), colors.bright);
  log('All tests passed!', colors.green + colors.bright);
  log('='.repeat(50) + '\n', colors.bright);
}

main().catch((error) => {
  log(`\n✗ Test failed: ${error.message}`, colors.red);
  process.exit(1);
});

