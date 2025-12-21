# PowerShell script to help check GitHub Actions workflow status
# This script provides links and instructions to check workflow status

Write-Host "GitHub Actions Workflow Test Kontrolü" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

Write-Host "1. Variables Kontrolü:" -ForegroundColor Yellow
Write-Host "   GitHub'da Variables sekmesinde NEON_PROJECT_ID var mı kontrol edin" -ForegroundColor White
Write-Host "   Link: https://github.com/metinbagdat/learnconnect-/settings/secrets/actions" -ForegroundColor Cyan
Write-Host "   Variables sekmesine tıklayın ve 'quiet-tooth-34242456' değerini kontrol edin" -ForegroundColor White
Write-Host ""

Write-Host "2. Workflow Durumu:" -ForegroundColor Yellow
Write-Host "   GitHub Actions sayfasına gidin ve son workflow run'ı kontrol edin" -ForegroundColor White
Write-Host "   Link: https://github.com/metinbagdat/learnconnect-/actions" -ForegroundColor Cyan
Write-Host ""

Write-Host "3. Eğer workflow çalışmadıysa, yeni bir test commit push edin:" -ForegroundColor Yellow
Write-Host "   git commit --allow-empty -m 'Test workflow'" -ForegroundColor White
Write-Host "   git push github main" -ForegroundColor White
Write-Host ""

Write-Host "4. Kontrol Edilecek Adımlar:" -ForegroundColor Yellow
Write-Host "   - Check Neon Credentials (basari durumu)" -ForegroundColor White
Write-Host "   - Create Neon Branch (basari durumu)" -ForegroundColor White
Write-Host "   - Run Database Migrations (basari durumu)" -ForegroundColor White
Write-Host ""

Write-Host "Workflow'u kontrol edip sonucu paylasin!" -ForegroundColor Green

