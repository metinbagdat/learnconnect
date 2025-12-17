# Check and Verify DATABASE_URL in Vercel
# This script helps verify if DATABASE_URL is set correctly in Vercel

Write-Host "🔍 Checking Vercel Environment Variables..." -ForegroundColor Cyan
Write-Host ""

# List all environment variables
Write-Host "📋 Current Environment Variables in Vercel:" -ForegroundColor Yellow
vercel env ls

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# Check if DATABASE_URL exists
Write-Host "🔍 Checking for DATABASE_URL..." -ForegroundColor Cyan
$envList = vercel env ls 2>&1 | Out-String

if ($envList -match "DATABASE_URL") {
    Write-Host "✅ DATABASE_URL is set in Vercel" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  To verify the format, you need to:" -ForegroundColor Yellow
    Write-Host "   1. Go to: https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables" -ForegroundColor White
    Write-Host "   2. Find DATABASE_URL and check its value" -ForegroundColor White
    Write-Host "   3. Make sure it:" -ForegroundColor White
    Write-Host "      - Starts with 'postgresql://' (NOT 'https://')" -ForegroundColor White
    Write-Host "      - Contains '-pooler' in hostname OR uses port 5432" -ForegroundColor White
    Write-Host "      - Ends with '?sslmode=require'" -ForegroundColor White
} else {
    Write-Host "❌ DATABASE_URL is NOT set in Vercel" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 To add it:" -ForegroundColor Yellow
    Write-Host "   1. Get your Neon pooler connection string from:" -ForegroundColor White
    Write-Host "      https://console.neon.tech/ → Connection Details → Pooler tab" -ForegroundColor White
    Write-Host "   2. Add it to Vercel:" -ForegroundColor White
    Write-Host "      https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables" -ForegroundColor White
    Write-Host "   3. Or use CLI: vercel env add DATABASE_URL production" -ForegroundColor White
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""
Write-Host "📖 For detailed instructions, see: FIX_SSL_ERROR.md" -ForegroundColor Cyan

