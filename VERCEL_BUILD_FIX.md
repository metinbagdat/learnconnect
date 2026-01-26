# Vercel Build Fix – Deployment Hatası Çözümü

## Sorun
- Production deploy'lar **Error** veriyordu (commit `41e7de1` – Teacher Panel vb.).
- egitim.today hâlâ 12 saat önceki başarılı deploy’u gösteriyordu.

## Kök Nedenler
1. **Eksik npm bağımlılıkları:** `@tanstack/react-query`, `framer-motion` kullanılıyordu ama `package.json`’da yoktu.
2. **Eksik client modülleri:** `@/components/ui/*`, `@/contexts/consolidated-language-context`, `@/hooks/use-toast`, `@/lib/queryClient`, `modern-navigation`, `page-wrapper`, `stat-card`, `bilingual-text` yoktu.
3. **Vite config:** `vite.config.ts` → `dist/public` yazıyordu; `vercel.json` → `outputDirectory: "dist"` bekliyordu.
4. **`@shared/schema`:** Client build’te kullanılıyordu; drizzle vb. sunucu bağımlılıkları browser build’ini bozuyordu.

## Yapılan Değişiklikler

### 1. package.json
- `@tanstack/react-query`, `framer-motion` eklendi.
- `build` ve `build:vercel`: `vite build --config vite.config.ts` kullanacak şekilde güncellendi.

### 2. Client stub’lar
- `client/src/components/ui/`: `card`, `button`, `badge`, `input`, `label`, `tabs`, `progress`, `bilingual-text`
- `client/src/contexts/consolidated-language-context.tsx`
- `client/src/hooks/use-toast.ts`
- `client/src/lib/queryClient.ts`: Gerçek `QueryClient` + `apiRequest`
- `client/src/components/layout/modern-navigation.tsx`, `page-wrapper.tsx`
- `client/src/components/dashboard/stat-card.tsx`

### 3. Vite
- `vite.config.ts`: `outDir` → `dist` (artık `dist/public` değil).
- `import.meta.dirname` → `fileURLToPath` + `__dirname` (Node uyumluluğu).

### 4. Diğer
- `main.tsx`: `QueryClientProvider` ile sarıldı.
- `client/src/types/tyt.ts`: TYT tipleri buraya alındı.
- `tyt-dashboard`: `@shared/schema` yerine `@/types/tyt` import ediyor.

## Vercel’de Kontrol

1. **Build:** `npm install` → `npm run build` (vite.config.ts ile client → `dist`).
2. **Output:** `outputDirectory: "dist"` ile uyumlu.
3. **API:** `api/*` rewrites aynı kaldı.

## Yerel Test (opsiyonel)

```bash
npm install
npm run build
npm run preview
```

## Sonraki Adım

Değişiklikleri push’layıp Vercel’in yeni deploy’u oluşturmasını bekle. Build’in **Ready** olması gerekir; ardından egitim.today’de güncel sürüm görünür.
