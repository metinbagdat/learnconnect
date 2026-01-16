# Build Instructions

## Local Development

### Normal Build (with TypeScript checking)
```powershell
npm run build
npm run preview
```

### Vercel Build (skip TypeScript check - for faster builds)

**PowerShell:**
```powershell
cd C:\Users\mb\Desktop\LearnConnect\LearnConnect
$env:SKIP_TYPE_CHECK = "true"
npm run build:vercel
```

**Linux/Mac:**
```bash
SKIP_TYPE_CHECK=true npm run build:vercel
```

**Note:** The `SKIP_TYPE_CHECK` environment variable is optional. If not set, the build will still work but may be slower due to TypeScript checking.

## Production Deployment

For Vercel deployment, the build process automatically uses the appropriate settings. No manual environment variable setup is needed in CI/CD pipelines.

## Troubleshooting

- **SSL errors when installing packages:** This is a local environment issue (antivirus/proxy). The application works fine without `cross-env` - just use PowerShell's native `$env:` syntax to set environment variables.
- **Build errors:** Make sure you're in the project root directory and have run `npm install` first.
