# Vercel Environment Variables Setup

## Firebase Environment Variables

Vercel Dashboard'da environment variables eklemek için:

### Adımlar

1. [Vercel Dashboard](https://vercel.com/dashboard) → Projenizi seçin
2. **Settings** → **Environment Variables**
3. Aşağıdaki değişkenleri ekleyin:

### Gerekli Değişkenler

```
VITE_FIREBASE_API_KEY=AIzaSyDeZACW1poVyTucZgq0Y1JnqlAumRhnwkg
VITE_FIREBASE_AUTH_DOMAIN=learnconnect-7c499.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=learnconnect-7c499
VITE_FIREBASE_STORAGE_BUCKET=learnconnect-7c499.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=94708429652
VITE_FIREBASE_APP_ID=1:94708429652:web:af1e854867d6eeaf3dcec1
VITE_FIREBASE_MEASUREMENT_ID=G-SKHJCN4ST9
```

### Environment Seçimi

Her değişken için şu environment'ları seçin:
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

### Önemli Notlar

- Environment variables eklendikten sonra yeni deployment gerekir
- Mevcut deployment'lar eski değerleri kullanmaya devam eder
- Değişikliklerden sonra **Redeploy** yapın

### Hızlı Ekleme

Vercel CLI ile de ekleyebilirsiniz:

```bash
vercel env add VITE_FIREBASE_API_KEY production
vercel env add VITE_FIREBASE_AUTH_DOMAIN production
vercel env add VITE_FIREBASE_PROJECT_ID production
vercel env add VITE_FIREBASE_STORAGE_BUCKET production
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production
vercel env add VITE_FIREBASE_APP_ID production
vercel env add VITE_FIREBASE_MEASUREMENT_ID production
```

Her birinde değeri girmeniz istenecek.
