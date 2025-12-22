# Vercel ESM Import Issue

## Problem
Vercel's serverless function bundler is resolving imports like `../db.js` to `/var/task/server/db` (without the `.js` extension), causing `ERR_MODULE_NOT_FOUND` errors.

## Root Cause
Vercel uses esbuild internally to bundle serverless functions. When esbuild resolves imports, it may be stripping the `.js` extension in the bundled output, even though the source code correctly includes them.

## Current Status
- ✅ All source files have correct `.js` extensions in imports
- ✅ All `@shared/*` imports have been replaced with relative paths
- ✅ TypeScript config uses `moduleResolution: "node16"` which should preserve extensions
- ❌ Vercel's bundler still strips extensions in runtime

## Attempted Solutions
1. ✅ Fixed all imports to include `.js` extensions (128 files)
2. ✅ Replaced all `@shared/*` imports with relative paths
3. ✅ Added `tsconfig.vercel.json` with explicit ESM settings
4. ✅ Added runtime verification script

## Next Steps to Try

### Option 1: Use explicit file extensions in package.json exports
Add an `exports` field to `package.json` to help Vercel resolve modules:

```json
{
  "exports": {
    "./server/db": "./server/db.js",
    "./server/db.js": "./server/db.js"
  }
}
```

### Option 2: Create wrapper files
Create `server/db.js` that re-exports from `server/db.ts` (but this won't work since we're using TypeScript).

### Option 3: Use Vercel's build output API
Configure Vercel to use a custom build process that preserves extensions.

### Option 4: Contact Vercel Support
This might be a bug in Vercel's bundler. Consider reporting it.

## Verification
Run `node scripts/verify-vercel-imports.js` to verify all imports are correct locally.

