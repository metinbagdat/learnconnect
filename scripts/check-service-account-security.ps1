# Check if service account key is committed to git
# Run this script to verify security status

Write-Host "🔒 Checking Service Account Key Security Status..." -ForegroundColor Yellow
Write-Host ""

$filePath = "scripts/service-account-key.json"

# Check if file exists
if (Test-Path $filePath) {
    Write-Host "✅ File exists: $filePath" -ForegroundColor Green
} else {
    Write-Host "❌ File not found: $filePath" -ForegroundColor Red
    exit 1
}

# Check if file is tracked by git
Write-Host "`nChecking if file is tracked by git..." -ForegroundColor Cyan
$tracked = git ls-files $filePath 2>&1

if ($tracked) {
    Write-Host "⚠️  CRITICAL: File is tracked by git!" -ForegroundColor Red
    Write-Host "   The service account key is committed to version control." -ForegroundColor Red
    Write-Host "   You should:" -ForegroundColor Yellow
    Write-Host "   1. Remove it from git: git rm --cached $filePath" -ForegroundColor White
    Write-Host "   2. Rotate the key in Firebase Console" -ForegroundColor White
    Write-Host "   3. Update .gitignore (already done)" -ForegroundColor White
} else {
    Write-Host "✅ File is NOT tracked by git" -ForegroundColor Green
}

# Check if file is ignored
Write-Host "`nChecking if file is ignored by .gitignore..." -ForegroundColor Cyan
$ignored = git check-ignore $filePath 2>&1

if ($ignored) {
    Write-Host "✅ File is properly ignored by .gitignore" -ForegroundColor Green
} else {
    Write-Host "⚠️  File is NOT ignored. Check .gitignore configuration." -ForegroundColor Yellow
}

# Check if file is in recent commits
Write-Host "`nChecking git history for the file..." -ForegroundColor Cyan
$inHistory = git log --all --full-history -- $filePath 2>&1

if ($inHistory -match "commit") {
    Write-Host "⚠️  WARNING: File appears in git history!" -ForegroundColor Red
    Write-Host "   Consider removing from history or rotating the key." -ForegroundColor Yellow
} else {
    Write-Host "✅ File not found in git history" -ForegroundColor Green
}

Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "   - File exists: $(if (Test-Path $filePath) { 'Yes' } else { 'No' })" -ForegroundColor White
Write-Host "   - Tracked by git: $(if ($tracked) { 'YES ⚠️' } else { 'No ✅' })" -ForegroundColor $(if ($tracked) { 'Red' } else { 'Green' })
Write-Host "   - Ignored by .gitignore: $(if ($ignored) { 'Yes ✅' } else { 'No ⚠️' })" -ForegroundColor $(if ($ignored) { 'Green' } else { 'Yellow' })
Write-Host "   - In git history: $(if ($inHistory -match 'commit') { 'YES ⚠️' } else { 'No ✅' })" -ForegroundColor $(if ($inHistory -match 'commit') { 'Red' } else { 'Green' })

Write-Host "`n💡 Recommendations:" -ForegroundColor Cyan
if ($tracked -or ($inHistory -match 'commit')) {
    Write-Host "   1. ⚠️  ROTATE the service account key in Firebase Console" -ForegroundColor Red
    Write-Host "   2. Remove from git: git rm --cached $filePath" -ForegroundColor Yellow
    Write-Host "   3. Commit the removal" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Your service account key appears to be secure!" -ForegroundColor Green
    Write-Host "   Continue using it, but remember to rotate keys periodically." -ForegroundColor White
}
