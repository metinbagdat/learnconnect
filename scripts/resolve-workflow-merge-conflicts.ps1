# PR merge çakışması: workflow dosyalarını bu repodaki hedef sürüme göre çöz.
# Kullanım (repo kökünde, merge/rebase sırasında):
#   powershell -ExecutionPolicy Bypass -File scripts/resolve-workflow-merge-conflicts.ps1
# Sonra: git status  →  git commit

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Write-Host "Repo: $root"

$legacy = @(
  ".github/workflows/build-and-test.yml",
  ".github/workflows/neon-branch-pr-with-migrations-improved.yml"
)
foreach ($f in $legacy) {
  if (Test-Path (Join-Path $root $f)) {
    git rm -f $f
    Write-Host "Removed (legacy): $f"
  } else {
    Write-Host "Skip (absent): $f"
  }
}

$keep = @(
  ".github/workflows/ci.yml",
  ".github/workflows/frontend-build.yml",
  ".github/workflows/neon-branch-pr-with-migrations.yml",
  ".github/workflows/vercel-deploy.yml"
)
foreach ($f in $keep) {
  git add $f
  Write-Host "Staged: $f"
}

Write-Host ""
Write-Host "Done. Next: git status"
Write-Host "If merge in progress: git commit"
