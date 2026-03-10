# Import Testing Guide

## Overview

We've created comprehensive tests to verify that all imports are configured correctly for Vercel deployment. These tests ensure:

1. ✅ All relative imports have `.js` extensions
2. ✅ No `@shared/*` imports remain (all replaced with relative paths)
3. ✅ Bundled API file is valid and ready for deployment
4. ✅ All import paths resolve correctly

## Available Tests

### 1. Basic Import Verification (`test:imports`)

**Command:**
```bash
npm run test:imports
```

**What it checks:**
- All relative imports have `.js` extensions
- No `@shared/*` imports in source files
- Import paths resolve correctly
- Build script exists and is valid

**When to use:**
- Before committing code changes
- After fixing import issues
- As part of CI/CD pipeline

**Example output:**
```
🧪 Running Import Verification Tests
✅ All relative imports have .js extensions
✅ No @shared/* imports found
✅ All test import paths resolve correctly
✅ All critical tests passed!
```

### 2. Bundled API Test (`test:bundle`)

**Command:**
```bash
npm run test:bundle
```

**What it checks:**
- Builds the API function successfully
- Verifies bundled file exists and is valid JavaScript
- Checks for import issues in bundled code
- Verifies file size is reasonable
- Ensures no TypeScript syntax in output

**When to use:**
- Before deploying to Vercel
- After making changes to API code
- To verify the build process works

**Example output:**
```
🧪 Testing Bundled API Function
✅ Build completed successfully
✅ Bundled file exists (1.39 MB)
✅ File is valid JavaScript
✅ No import issues found
✅ All tests passed!
```

## Running Tests

### Run All Tests

```bash
# Run basic import verification
npm run test:imports

# Build and test the bundled API
npm run test:bundle
```

### In CI/CD

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Test Imports
  run: npm run test:imports

- name: Test Bundled API
  run: npm run test:bundle
```

## What the Tests Verify

### ✅ Correct Import Extensions

All relative imports must include `.js` extension:
```typescript
// ✅ Correct
import { db } from "../db.js";
import { schema } from "../../shared/schema.js";

// ❌ Wrong
import { db } from "../db";
import { schema } from "../../shared/schema";
```

### ✅ No Path Aliases

All `@shared/*` imports must be replaced with relative paths:
```typescript
// ✅ Correct
import { schema } from "../../shared/schema.js";

// ❌ Wrong
import { schema } from "@shared/schema";
```

### ✅ Valid Bundled Output

The bundled API file must:
- Be valid JavaScript (no TypeScript syntax)
- Not contain unresolved imports
- Have reasonable file size (< 10 MB)
- Export required functions

## Troubleshooting

### Test Fails: Missing .js Extensions

**Fix:** Run the import fixer script:
```bash
node scripts/fix-imports.js
```

### Test Fails: @shared/* Imports Found

**Fix:** Replace with relative paths:
```typescript
// Find and replace
@shared/schema → ../../shared/schema.js
@shared/utils → ../../shared/utils.js
```

### Test Fails: Bundled File Not Found

**Fix:** Build the API function:
```bash
node build-vercel-api.js
```

### Test Fails: TypeScript in Bundled File

**Issue:** Build process not compiling TypeScript correctly.

**Fix:** Check `build-vercel-api.js` configuration and ensure esbuild is properly configured.

## Best Practices

1. **Run tests before committing:**
   ```bash
   npm run test:imports
   ```

2. **Test bundled output before deploying:**
   ```bash
   npm run test:bundle
   ```

3. **Fix issues immediately:**
   - Don't ignore test failures
   - Fix import issues as they're found
   - Verify fixes with tests

4. **Keep tests updated:**
   - Add new test cases as issues are discovered
   - Update tests when import patterns change

## Integration with Vercel

These tests ensure your code will work correctly on Vercel:

- ✅ All imports are ESM-compatible
- ✅ No module resolution issues at runtime
- ✅ Bundled code is production-ready
- ✅ No TypeScript syntax in deployed code

## Summary

| Test | Command | Purpose |
|------|---------|---------|
| Import Verification | `npm run test:imports` | Check source code imports |
| Bundled API Test | `npm run test:bundle` | Verify build output |

Run both tests before deploying to ensure everything works correctly!

