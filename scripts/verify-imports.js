import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
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

function getAllTsFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach((file) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and dist
      if (!['node_modules', 'dist', '.git'].includes(file)) {
        getAllTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function checkImports(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const issues = [];

  // Check for @shared/* imports without .js extension in ES modules
  const sharedImportRegex = /from\s+['"]@shared\/([^'"]+)['"]/g;
  let match;
  while ((match = sharedImportRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (!importPath.endsWith('.js') && !importPath.endsWith('.ts')) {
      issues.push({
        type: 'missing_extension',
        line: content.substring(0, match.index).split('\n').length,
        import: `@shared/${importPath}`,
        suggestion: `@shared/${importPath}.js`,
      });
    }
  }

  // Check for relative imports without .js extension
  const relativeImportRegex = /from\s+['"]\.\.?\/[^'"]*[^'"]\.js['"]|from\s+['"]\.\.?\/[^'"]+['"]/g;
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    const relativeMatch = line.match(/from\s+['"](\.\.?\/[^'"]+)['"]/);
    if (relativeMatch) {
      const importPath = relativeMatch[1];
      // Skip if it's already .js or if it's importing a directory (package-like)
      if (!importPath.endsWith('.js') && 
          !importPath.endsWith('.ts') && 
          !importPath.match(/\/[^/]+$/) && // Doesn't end with filename (might be a package)
          !importPath.includes('node_modules')) {
        // Check if file exists with .ts extension
        const importDir = dirname(filePath);
        const fullImportPath = join(importDir, importPath);
        const tsPath = fullImportPath + '.ts';
        
        try {
          const stat = statSync(tsPath);
          if (stat.isFile()) {
            issues.push({
              type: 'missing_js_extension',
              line: index + 1,
              import: importPath,
              suggestion: `${importPath}.js`,
            });
          }
        } catch (e) {
          // File doesn't exist, might be intentional
        }
      }
    }
  });

  return issues;
}

async function main() {
  log('\n' + '='.repeat(50), colors.bright);
  log('Import Verification', colors.bright);
  log('='.repeat(50), colors.bright);

  const serverDir = join(rootDir, 'server');
  const apiDir = join(rootDir, 'api');
  
  const files = [
    ...getAllTsFiles(serverDir),
    ...getAllTsFiles(apiDir),
  ];

  log(`\nChecking ${files.length} TypeScript files...\n`, colors.blue);

  let totalIssues = 0;
  const filesWithIssues = [];

  files.forEach((filePath) => {
    const issues = checkImports(filePath);
    if (issues.length > 0) {
      totalIssues += issues.length;
      filesWithIssues.push({ filePath, issues });
    }
  });

  if (filesWithIssues.length === 0) {
    log('✓ All imports verified successfully!', colors.green);
  } else {
    log(`\nFound ${totalIssues} issue(s) in ${filesWithIssues.length} file(s):\n`, colors.yellow);
    
    filesWithIssues.forEach(({ filePath, issues }) => {
      const relativePath = relative(rootDir, filePath);
      log(`\n${relativePath}:`, colors.blue);
      
      issues.forEach((issue) => {
        log(`  Line ${issue.line}: ${issue.type}`, colors.red);
        log(`    Import: ${issue.import}`, colors.yellow);
        log(`    Suggestion: ${issue.suggestion}`, colors.green);
      });
    });

    process.exit(1);
  }

  log('\n' + '='.repeat(50) + '\n', colors.bright);
}

main().catch((error) => {
  log(`\n✗ Verification failed: ${error.message}`, colors.red);
  process.exit(1);
});

