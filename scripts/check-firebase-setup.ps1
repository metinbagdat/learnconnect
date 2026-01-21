# Firebase Setup Checker Script
# Checks if Firebase is properly configured

Write-Host "🔍 Checking Firebase Setup..." -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()
$success = @()

# Check 1: Firebase in package.json
Write-Host "1. Checking package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    if ($packageJson.dependencies.firebase -or $packageJson.devDependencies.firebase) {
        $version = $packageJson.dependencies.firebase ?? $packageJson.devDependencies.firebase
        Write-Host "   [OK] Firebase found in package.json: $version" -ForegroundColor Green
        $success += "Firebase in package.json"
    } else {
        Write-Host "   [ERROR] Firebase not found in package.json" -ForegroundColor Red
        $errors += "Firebase not in package.json"
    }
} else {
    Write-Host "   ❌ package.json not found" -ForegroundColor Red
    $errors += "package.json missing"
}

# Check 2: Firebase config file
Write-Host "2. Checking Firebase config file..." -ForegroundColor Yellow
if (Test-Path "client/src/lib/firebase.ts") {
    Write-Host "   [OK] Firebase config file exists" -ForegroundColor Green
    $success += "Firebase config file"
} else {
    Write-Host "   [ERROR] Firebase config file not found" -ForegroundColor Red
    $errors += "firebase.ts missing"
}

# Check 3: Environment variables
Write-Host "3. Checking .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    $requiredVars = @(
        "VITE_FIREBASE_API_KEY",
        "VITE_FIREBASE_AUTH_DOMAIN",
        "VITE_FIREBASE_PROJECT_ID",
        "VITE_FIREBASE_STORAGE_BUCKET",
        "VITE_FIREBASE_MESSAGING_SENDER_ID",
        "VITE_FIREBASE_APP_ID"
    )
    
    $missingVars = @()
    $placeholderVars = @()
    
    foreach ($var in $requiredVars) {
        if ($envContent -match $var) {
            if ($envContent -match "$var=your_" -or $envContent -match "$var=xxx") {
                $placeholderVars += $var
            } else {
                Write-Host "   [OK] $var is set" -ForegroundColor Green
            }
        } else {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "   [ERROR] Missing variables: $($missingVars -join ', ')" -ForegroundColor Red
        $errors += "Missing env vars: $($missingVars -join ', ')"
    }
    
    if ($placeholderVars.Count -gt 0) {
        Write-Host "   [WARNING] Placeholder values found: $($placeholderVars -join ', ')" -ForegroundColor Yellow
        $warnings += "Placeholder values: $($placeholderVars -join ', ')"
    }
    
    if ($missingVars.Count -eq 0 -and $placeholderVars.Count -eq 0) {
        $success += "All Firebase env vars configured"
    }
} else {
    Write-Host "   [ERROR] .env file not found" -ForegroundColor Red
    $errors += ".env file missing"
}

# Check 4: node_modules
Write-Host "4. Checking node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules/firebase") {
    Write-Host "   [OK] Firebase installed in node_modules" -ForegroundColor Green
    $success += "Firebase installed"
} else {
    Write-Host "   [WARNING] Firebase not installed - please run: npm install" -ForegroundColor Yellow
    $warnings += "Firebase not installed"
}

# Check 5: Component files
Write-Host "5. Checking component files..." -ForegroundColor Yellow
$components = @(
    "client/src/components/curriculum/curriculum-tree.tsx",
    "client/src/components/curriculum/ai-plan-generator.tsx",
    "client/src/services/curriculumService.ts"
)

foreach ($component in $components) {
    if (Test-Path $component) {
        Write-Host "   [OK] $(Split-Path $component -Leaf) exists" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] $component not found" -ForegroundColor Red
        $errors += "$component missing"
    }
}

# Summary
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   [OK] Success: $($success.Count) items" -ForegroundColor Green
Write-Host "   [WARNING] Warnings: $($warnings.Count) items" -ForegroundColor Yellow
Write-Host "   [ERROR] Errors: $($errors.Count) items" -ForegroundColor Red

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host ""
    Write-Host "[SUCCESS] Firebase setup is complete!" -ForegroundColor Green
} elseif ($errors.Count -eq 0) {
    Write-Host ""
    Write-Host "[WARNING] Setup is mostly complete, but some warnings need attention." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "[ERROR] Setup incomplete. Please fix the errors above." -ForegroundColor Red
}

Write-Host ""
