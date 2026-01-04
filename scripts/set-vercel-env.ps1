# PowerShell script to set Vercel environment variables
# Run this script to add all required environment variables to Vercel

Write-Host "🚀 Setting Vercel Environment Variables..." -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Install it with: npm i -g vercel" -ForegroundColor Red
    exit 1
}

# Environment variables to set
$envVars = @{
    "ANTHROPIC_API_KEY" = "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"
    "ANTHROPIC_MODEL" = "claude-3-5-sonnet-20241022"
    "OPENAI_API_KEY" = "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"
    "DEEPSEEK_API_KEY" = "sk-e67063c2b0434270ad78333f531fee7d"
    "STRIPE_SECRET_KEY" = "sk_test_51RDRaOQx5TUeWOnWh7XgcYRoD2zYdZFa27svPuX3QpWpW6b8De6wbBDBRzf1MPx18I2ZxSFBxKb30lIfOGXR7b19000peRZKCe"
    "STRIPE_PUBLISHABLE_KEY" = "pk_test_51RDRaOQx5TUeWOnWAkiLB4exPzJVaZW0jJ2drUUvStLDjuYgHCCL2bKKG3TsmN666TlcV2TbRWu9wGKZlBN83FWY00uPKMLpPx"
    "VITE_STRIPE_PUBLIC_KEY" = "pk_test_51RDRaOQx5TUeWOnWAkiLB4exPzJVaZW0jJ2drUUvStLDjuYgHCCL2bKKG3TsmN666TlcV2TbRWu9wGKZlBN83FWY00uPKMLpPx"
}

Write-Host "📝 Setting environment variables for Production environment..." -ForegroundColor Yellow
Write-Host ""

foreach ($key in $envVars.Keys) {
    Write-Host "Setting $key..." -ForegroundColor Gray
    $value = $envVars[$key]
    
    # Use Vercel CLI to set environment variable
    $result = echo $value | vercel env add $key production 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ $key set successfully" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Failed to set $key" -ForegroundColor Red
        Write-Host "  Error: $result" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Environment variables setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Make sure to also set:" -ForegroundColor Yellow
Write-Host "   - DATABASE_URL (Neon PostgreSQL pooler connection)" -ForegroundColor Yellow
Write-Host "   - SESSION_SECRET (Generate with: openssl rand -base64 32)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next step: Push to Git to trigger deployment" -ForegroundColor Cyan
Write-Host "  git push origin main" -ForegroundColor Cyan

