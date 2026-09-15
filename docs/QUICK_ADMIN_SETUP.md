# 🚀 Admin Dashboard Hızlı Kurulum

## ✅ Otomatik Tamamlanan İşlemler

- ✅ Firestore Rules güncellendi
- ✅ Admin auth hook oluşturuldu
- ✅ Tüm admin bileşenleri hazır
- ✅ AI curriculum generator hazır
- ✅ Routing dosyası (`admin-page.tsx`) hazır
- ✅ Curriculum prompts dosyası oluşturuldu

## 📋 5 Manuel Adım

### 1️⃣ Firebase Console'da Admin Kullanıcı Oluştur

```
1. Firebase Console → Authentication → Users
2. "Add User" → Email + Password girin
3. User UID'yi kopyalayın (örn: abc123xyz456...)
```

### 2️⃣ Firestore'da Admins Koleksiyonu

```
1. Firestore Database → "Start collection"
2. Collection ID: admins
3. Document ID: Admin UID (1. adımdan)
4. Fields ekle:
   - email: "admin@learnconnect.com" (string)
   - role: "super_admin" (string)
   - permissions: ["manage_content", "manage_users", "view_analytics"] (array)
   - createdAt: [Timestamp] (şu anki zaman)
```

### 3️⃣ Firestore Rules Publish

```
1. Firestore Database → Rules
2. firestore.rules dosyasını kopyala-yapıştır
3. "Publish" butonuna tıkla
```

### 4️⃣ Routing'e Admin Route Ekle

Wouter kullanıldığı için, ana routing dosyanıza ekleyin:

```typescript
import { Route } from 'wouter';
import AdminPage from '@/pages/admin-page';

// Router içinde:
<Route path="/admin" component={AdminPage} />
```

**Detaylı talimatlar:** `ROUTING_ADMIN_SETUP.md` dosyasına bakın.

### 5️⃣ OpenAI API Key (Opsiyonel)

**Local (.env):**
```env
OPENAI_API_KEY=sk-your-key-here
```

**Vercel:**
```
Settings → Environment Variables → Add:
Key: OPENAI_API_KEY
Value: sk-your-key-here
Environments: Production, Preview, Development
```

**Not:** Key yoksa mock data kullanılır (test için yeterli).

## 🧪 Test

1. `/admin` sayfasına gidin
2. Admin email/password ile login olun
3. Admin panel görünmeli
4. **Müfredat** sekmesinden ders ekleyin
5. TYT Dashboard'da görüntüleyin

## 📚 Detaylı Dokümantasyon

- **ADMIN_SETUP_COMPLETE.md** - Tüm adımlar detaylı
- **ROUTING_ADMIN_SETUP.md** - Routing örnekleri
- **ADMIN_DASHBOARD_SETUP.md** - Genel kurulum rehberi

## ⚠️ Sorun Giderme

**Login çalışmıyor?**
- ✅ Firebase Auth'da kullanıcı var mı?
- ✅ Firestore'da `admins/{uid}` var mı?
- ✅ Rules publish edildi mi?

**Permission denied?**
- ✅ Rules'da `isAdmin()` fonksiyonu var mı?
- ✅ Admin UID `admins` koleksiyonunda mı?

**Route çalışmıyor?**
- ✅ `admin-page.tsx` import edildi mi?
- ✅ Route path `/admin` doğru mu?

## 🎉 Hazır!

Tüm adımları tamamladıktan sonra admin dashboard kullanıma hazır!
