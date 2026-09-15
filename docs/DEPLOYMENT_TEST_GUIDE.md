# Deployment Testing Guide

Based on `DEPLOYMENT_ANALYSIS.md` testing recommendations.

## 🧪 Testing Steps

### 1. Functionality Testing

#### 1.1 Health Check Endpoint
```powershell
# Test health endpoint
Invoke-RestMethod -Uri "https://learn-connect.vercel.app/api/system/health" -Method Get
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "status": "HEALTHY",
    "timestamp": "...",
    "database": "connected",
    "sessions": "active"
  }
}
```

#### 1.2 System Metrics Endpoint
```powershell
# Note: May require authentication
Invoke-RestMethod -Uri "https://learn-connect.vercel.app/api/system/metrics" -Method Get
```

#### 1.3 Root URL Accessibility
Open in browser or test:
```powershell
$response = Invoke-WebRequest -Uri "https://learn-connect.vercel.app"
$response.StatusCode  # Should be 200
```

---

### 2. Security Headers Testing

#### 2.1 Check Security Headers
```powershell
$headers = (Invoke-WebRequest -Uri "https://learn-connect.vercel.app" -UseBasicParsing).Headers

# Check for required headers
$headers["X-Content-Type-Options"]  # Should be "nosniff"
$headers["X-Frame-Options"]         # Should be "DENY"
$headers["X-XSS-Protection"]        # Should be "1; mode=block"
$headers["Referrer-Policy"]         # Should be "strict-origin-when-cross-origin"
$headers["Permissions-Policy"]     # Should contain restrictions
```

**Expected Headers:**
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY`
- ✅ `X-XSS-Protection: 1; mode=block`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Permissions-Policy: camera=(), microphone=(), geolocation=()`

#### 2.2 Using Browser DevTools
1. Open: https://learn-connect.vercel.app
2. Press F12 (Developer Tools)
3. Go to Network tab
4. Refresh page
5. Click on the main document request
6. Check Response Headers section

---

### 3. Caching Headers Testing

#### 3.1 Static Asset Caching
```powershell
# Test a static asset (adjust path as needed)
$assetUrl = "https://learn-connect.vercel.app/assets/index.js"
$headers = (Invoke-WebRequest -Uri $assetUrl -Method Head -UseBasicParsing).Headers
$headers["Cache-Control"]  # Should contain "max-age=31536000, immutable"
```

**Expected:**
- Static assets (JS/CSS): `Cache-Control: public, max-age=31536000, immutable`

#### 3.2 HTML Cache Control
```powershell
$headers = (Invoke-WebRequest -Uri "https://learn-connect.vercel.app" -UseBasicParsing).Headers
$headers["Cache-Control"]  # Should contain "max-age=0" or "must-revalidate"
```

**Expected:**
- HTML: `Cache-Control: public, max-age=0, must-revalidate`

#### 3.3 Image Caching
```powershell
# Test an image (if available)
$imageUrl = "https://learn-connect.vercel.app/some-image.png"
$headers = (Invoke-WebRequest -Uri $imageUrl -Method Head -UseBasicParsing).Headers
$headers["Cache-Control"]  # Should contain "max-age=86400"
```

**Expected:**
- Images: `Cache-Control: public, max-age=86400, stale-while-revalidate=604800`

---

### 4. Performance Testing

#### 4.1 Response Time Test
```powershell
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
$response = Invoke-WebRequest -Uri "https://learn-connect.vercel.app" -UseBasicParsing
$stopwatch.Stop()
Write-Host "Response Time: $($stopwatch.ElapsedMilliseconds)ms"
```

**Target:** < 2000ms (2 seconds)

#### 4.2 API Response Time
```powershell
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
$response = Invoke-RestMethod -Uri "https://learn-connect.vercel.app/api/system/health"
$stopwatch.Stop()
Write-Host "API Response Time: $($stopwatch.ElapsedMilliseconds)ms"
```

**Target:** < 100ms (p95)

#### 4.3 Using Browser DevTools
1. Open: https://learn-connect.vercel.app
2. Press F12 (Developer Tools)
3. Go to Network tab
4. Check "Disable cache"
5. Refresh page (Ctrl+F5)
6. Check "Time" column for response times

---

### 5. Session Persistence Testing

#### 5.1 Test Login/Logout Flow
1. Visit: https://learn-connect.vercel.app
2. Log in with test account
3. Verify session persists
4. Check browser cookies for session cookie
5. Wait 5 minutes
6. Refresh page - should still be logged in
7. Log out
8. Verify session cleared

#### 5.2 Database Session Check
If you have database access:
```sql
-- Check session table exists
SELECT COUNT(*) FROM session WHERE expire > NOW();
```

---

### 6. CORS Policy Testing

#### 6.1 Check CORS Headers
```powershell
$headers = (Invoke-WebRequest -Uri "https://learn-connect.vercel.app/api/system/health" -UseBasicParsing).Headers
$headers["Access-Control-Allow-Origin"]
$headers["Access-Control-Allow-Methods"]
$headers["Access-Control-Allow-Headers"]
```

**Note:** CORS headers may only be present for cross-origin requests.

---

### 7. Build Time Verification

#### 7.1 Check Vercel Dashboard
1. Go to: https://vercel.com/metinbahdats-projects/learn-connect/deployments
2. Check latest deployment
3. Review build time
4. **Target:** < 30 seconds consistently

#### 7.2 Build Time History
- Check last 10 deployments
- Calculate average build time
- Note variance (should be low with caching)

---

## 🔍 Online Testing Tools

### Security Headers
- **SecurityHeaders.com**: https://securityheaders.com/?q=https://learn-connect.vercel.app
- **Mozilla Observatory**: https://observatory.mozilla.org/

### Performance
- **Lighthouse**: Use Chrome DevTools (F12 > Lighthouse tab)
- **WebPageTest**: https://www.webpagetest.org/
- **GTmetrix**: https://gtmetrix.com/

### SSL/TLS
- **SSL Labs**: https://www.ssllabs.com/ssltest/

---

## 📋 Testing Checklist

### Pre-Deployment
- [ ] Local build successful: `npm run build`
- [ ] All environment variables set in Vercel
- [ ] Database connection tested
- [ ] Session storage configured (PostgreSQL)

### Post-Deployment
- [ ] Root URL accessible (200 OK)
- [ ] Health endpoint responding
- [ ] All security headers present
- [ ] Caching headers correct
- [ ] Response times acceptable (<2s)
- [ ] Session persistence working
- [ ] Build time consistent (<30s)
- [ ] No console errors in browser
- [ ] API endpoints functional

---

## 🐛 Troubleshooting

### Connection Errors
If you see "connection closed" errors:
1. Check internet connection
2. Try from different network
3. Check firewall/VPN settings
4. Try using browser instead of PowerShell

### SSL Errors
1. Update PowerShell TLS settings:
   ```powershell
   [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
   ```

### Missing Headers
1. Verify `vercel.json` is deployed
2. Check Vercel dashboard for configuration
3. Clear CDN cache if needed
4. Redeploy if necessary

### Slow Response Times
1. Check Vercel function logs
2. Review database query performance
3. Check for cold starts
4. Monitor function execution time

---

## 📊 Expected Results Summary

### Security Headers
- ✅ All 5 security headers present
- ✅ No security warnings

### Performance
- ✅ Page load: < 2 seconds
- ✅ API response: < 100ms (p95)
- ✅ Build time: < 30 seconds

### Functionality
- ✅ All endpoints responding
- ✅ Sessions persisting
- ✅ Database connected

---

## 🚀 Quick Test Commands

### All-in-One Test (PowerShell)
```powershell
$url = "https://learn-connect.vercel.app"

# Health check
Write-Host "Testing Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$url/api/system/health"
    Write-Host "✅ Health: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed" -ForegroundColor Red
}

# Security headers
Write-Host "Testing Security Headers..." -ForegroundColor Yellow
$headers = (Invoke-WebRequest -Uri $url -UseBasicParsing).Headers
$required = @("X-Content-Type-Options", "X-Frame-Options", "X-XSS-Protection")
foreach ($header in $required) {
    if ($headers.ContainsKey($header)) {
        Write-Host "✅ $header : $($headers[$header])" -ForegroundColor Green
    } else {
        Write-Host "❌ $header : Missing" -ForegroundColor Red
    }
}
```

---

**Status:** Ready for Testing  
**Last Updated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
