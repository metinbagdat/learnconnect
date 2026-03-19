# Debug Guide

Bu dokümantasyon, LearnConnect uygulamasında test ve debug yapmak için kullanabileceğiniz araçları ve yöntemleri açıklar.

## Hızlı Başlangıç

### Local Development

```bash
# Normal development mode
npm run dev

# Debug mode (verbose logging)
npm run dev:debug
```

### Import Verification

Deploy etmeden önce import'ları kontrol edin:

```bash
npm run verify:imports
```

Bu script tüm TypeScript dosyalarındaki import'ları kontrol eder ve eksik `.js` uzantıları veya hatalı path'leri bulur.

### Build Debugging

Build sorunlarını debug etmek için:

```bash
npm run debug:build
```

Bu script:
- Build configuration'ı kontrol eder
- esbuild plugin'lerini test eder
- Critical module'leri doğrular
- Output size'ı kontrol eder

### Local API Testing

```bash
npm run test:local
```

Bu script:
- Module resolution'ı test eder
- Server startup'ı kontrol eder
- API endpoint'lerini test eder (opsiyonel)

## Health Check Endpoints

### Production

- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system diagnostics

### Development Only

- `GET /api/debug/info` - Debug information (node version, env vars, memory)
- `GET /api/debug/modules` - Module resolution status

Bu endpoint'ler sadece `NODE_ENV=development` veya `ENABLE_DEBUG=true` olduğunda çalışır.

## Error Handling

### Error Classification

Sistemdeki hatalar şu kategorilere ayrılır:

1. **Database Errors** (`DATABASE_ERROR`)
   - Database connection failures
   - Query errors
   - Status: 503

2. **Module Errors** (`MODULE_ERROR`)
   - Module resolution failures
   - Missing imports
   - Status: 500

3. **Validation Errors** (`VALIDATION_ERROR`)
   - Input validation failures
   - Status: 400

4. **Authentication Errors** (`UNAUTHORIZED`)
   - Authentication failures
   - Status: 401

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { /* optional */ },
  "stack": "..." // Only in development
}
```

## Logging

### Log Levels

- `debug` - Detailed debugging information (development only)
- `info` - General information
- `warn` - Warnings
- `error` - Errors

### Log Format

```
[timestamp] [LEVEL] [requestId] [user:userId] [METHOD /path] message | context
```

### Request ID Tracking

Her request için otomatik bir request ID oluşturulur. Bu ID tüm log'larda görünür ve hataları takip etmeyi kolaylaştırır.

## Common Issues & Solutions

### FUNCTION_INVOCATION_FAILED

Bu hata genellikle şu nedenlerden kaynaklanır:

1. **Module Resolution Issues**
   - Çözüm: `npm run verify:imports` çalıştırın
   - Eksik `.js` uzantılarını ekleyin
   - `@shared/*` import'larını kontrol edin

2. **Build Size Issues**
   - Çözüm: `npm run debug:build` çalıştırın
   - Output size'ı kontrol edin (50MB+ sorunlu olabilir)

3. **Initialization Timeout**
   - Çözüm: `/api/debug/modules` endpoint'ini kontrol edin
   - Database connection'ı kontrol edin

### Module Not Found Errors

```bash
# Import'ları kontrol et
npm run verify:imports

# Build'i debug et
npm run debug:build
```

### Database Connection Issues

```bash
# Database connection'ı test et
npm run db:verify
```

Veya health check endpoint'ini kullanın:
```bash
curl https://your-domain.com/api/health/detailed
```

## Vercel Production Debugging

### Logs

1. Vercel Dashboard'a gidin
2. Deployment'ı seçin
3. "Functions" sekmesine tıklayın
4. `api/index.ts` fonksiyonunu bulun
5. "View Function Logs" butonuna tıklayın

### Request ID Tracking

Her request için bir request ID oluşturulur. Log'larda şu şekilde görünür:

```
[2024-12-21T10:00:00.000Z] INFO [req_1234567890_abc123] GET /api/login
```

Aynı request ID'yi kullanarak tüm ilgili log'ları bulabilirsiniz.

### Health Checks

Production'da health check endpoint'lerini kullanarak sistem durumunu kontrol edin:

```bash
# Basic health check
curl https://your-domain.com/api/health

# Detailed diagnostics
curl https://your-domain.com/api/health/detailed
```

## Best Practices

1. **Deploy Öncesi**
   - `npm run verify:imports` çalıştırın
   - `npm run debug:build` çalıştırın
   - Local'de test edin (`npm run dev`)

2. **Production Monitoring**
   - Health check endpoint'lerini düzenli kontrol edin
   - Request ID'leri kullanarak log'ları takip edin
   - Error code'larına göre hataları kategorize edin

3. **Debug Mode**
   - Production'da debug endpoint'lerini kullanmayın (security risk)
   - Development'ta `ENABLE_DEBUG=true` kullanabilirsiniz

## Test Utilities

### API Testing

```typescript
import { testAPIEndpoint } from './test-utils/api-test.js';

const response = await testAPIEndpoint('http://localhost:5000', '/api/health');
console.log(response.status, response.body);
```

### Database Testing

```typescript
import { testDatabaseConnection } from './test-utils/db-test.js';

const result = await testDatabaseConnection();
console.log(result.success, result.message);
```

## Troubleshooting Checklist

- [ ] Import'lar doğru mu? (`npm run verify:imports`)
- [ ] Build başarılı mı? (`npm run debug:build`)
- [ ] Database bağlantısı var mı? (`npm run db:verify`)
- [ ] Health check endpoint'i çalışıyor mu? (`/api/health`)
- [ ] Log'larda request ID'yi takip ediyor musunuz?
- [ ] Error code'una göre hatayı kategorize edebildiniz mi?

## Support

Sorun yaşıyorsanız:

1. Log'ları kontrol edin (request ID ile)
2. Health check endpoint'lerini kullanın
3. Debug script'lerini çalıştırın
4. Error code'una göre çözüm arayın

