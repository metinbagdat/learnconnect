# Fix: "Unrecognized key: createdAt" Error

## Problem
Frontend'de `/api/user` endpoint'inden gelen user objesi validate edilirken `createdAt` alanı reddediliyordu.

## Root Cause
`selectUserSchema` (frontend'de API response'ları validate etmek için kullanılan schema) `createdAt` ve `updatedAt` alanlarını içermiyordu.

## Solution
`shared/schema.ts` dosyasında `selectUserSchema`'ya `createdAt` ve `updatedAt` alanları eklendi:

```typescript
export const selectUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  // ... other fields ...
  createdAt: z.union([z.string(), z.date(), z.instanceof(Date)]).optional().catch(undefined),
  updatedAt: z.union([z.string(), z.date(), z.instanceof(Date)]).optional().catch(undefined),
}).passthrough(); // Allow additional fields without validation errors
```

## Key Changes
1. ✅ `createdAt` ve `updatedAt` alanları eklendi
2. ✅ `.optional()` ile opsiyonel yapıldı
3. ✅ `.catch(undefined)` ile hata durumunda undefined döndürülüyor
4. ✅ `.passthrough()` ile ekstra alanlar kabul ediliyor
5. ✅ `z.union()` ile hem string hem Date formatı kabul ediliyor

## Testing
Deploy tamamlandıktan sonra test edin:
1. `https://www.egitim.today/api/user` endpoint'ini test edin
2. Browser console'da "Unrecognized key: createdAt" hatasının kaybolduğunu doğrulayın
3. Auth flow'u test edin (login/register)

## Deployment
- New deployment URL: `https://learn-connect-hpwx9b83w-metinbahdats-projects.vercel.app`
- Domain update needed: `egitim.today` should point to new deployment
