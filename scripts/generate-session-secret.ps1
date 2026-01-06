# PowerShell script to generate SESSION_SECRET
# Usage: .\scripts\generate-session-secret.ps1

Write-Host "Generating SESSION_SECRET..." -ForegroundColor Cyan

$bytes = New-Object 'System.Byte[]' 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes)

Write-Host ""
Write-Host "SESSION_SECRET generated:" -ForegroundColor Green
Write-Host $secret -ForegroundColor Yellow
Write-Host ""
Write-Host "Copy this value and set it in Vercel:" -ForegroundColor Cyan
Write-Host "  https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables" -ForegroundColor Gray
Write-Host ""
Write-Host "Or add to .env file:" -ForegroundColor Cyan
Write-Host "  SESSION_SECRET=$secret" -ForegroundColor Gray

