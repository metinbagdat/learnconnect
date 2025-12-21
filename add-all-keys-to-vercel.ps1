# PowerShell script to add all API keys to Vercel
# Run this script to add all provided API keys as environment variables

Write-Host "Adding API Keys to Vercel Environment Variables..." -ForegroundColor Green
Write-Host "WARNING: These keys were shared in chat. Consider rotating them later for security." -ForegroundColor Yellow
Write-Host ""

# Change to project directory
Set-Location "C:\Users\mb\Desktop\LearnConnect\LearnConnect"

# ANTHROPIC_API_KEY
Write-Host "1. Adding ANTHROPIC_API_KEY..." -ForegroundColor Yellow
$ANTHROPIC_KEY = "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"
echo $ANTHROPIC_KEY | vercel env add ANTHROPIC_API_KEY production

# OPENAI_API_KEY
Write-Host "2. Adding OPENAI_API_KEY..." -ForegroundColor Yellow
$OPENAI_KEY = "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"
echo $OPENAI_KEY | vercel env add OPENAI_API_KEY production

# DEEPSEEK_API_KEY
Write-Host "3. Adding DEEPSEEK_API_KEY..." -ForegroundColor Yellow
$DEEPSEEK_KEY = "sk-e67063c2b0434270ad78333f531fee7d"
echo $DEEPSEEK_KEY | vercel env add DEEPSEEK_API_KEY production

# STRIPE_SECRET_KEY
Write-Host "4. Adding STRIPE_SECRET_KEY..." -ForegroundColor Yellow
$STRIPE_SECRET = "sk_test_51RDRaOQx5TUeWOnWh7XgcYRoD2zYdZFa27svPuX3QpWpW6b8De6wbBDBRzf1MPx18I2ZxSFBxKb30lIfOGXR7b19000peRZKCe"
echo $STRIPE_SECRET | vercel env add STRIPE_SECRET_KEY production

# STRIPE_PUBLISHABLE_KEY (for frontend)
Write-Host "5. Adding STRIPE_PUBLISHABLE_KEY..." -ForegroundColor Yellow
$STRIPE_PUBLIC = "pk_test_51RDRaOQx5TUeWOnWAkiLB4exPzJVaZW0jJ2drUUvStLDjuYgHCCL2bKKG3TsmN666TlcV2TbRWu9wGKZlBN83FWY00uPKMLpPx"
echo $STRIPE_PUBLIC | vercel env add STRIPE_PUBLISHABLE_KEY production

Write-Host ""
Write-Host "All API keys added to Vercel!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure DATABASE_URL and SESSION_SECRET are also set in Vercel" -ForegroundColor White
Write-Host "2. Go to Vercel dashboard to verify all variables are set" -ForegroundColor White
Write-Host "3. Redeploy the application" -ForegroundColor White
Write-Host ""
Write-Host "SECURITY REMINDER: Consider rotating these keys since they were shared publicly." -ForegroundColor Yellow
