# Admin Dashboard Kurulum Talimatları

## ✅ Tamamlanan İşlemler

1. ✅ Firestore Rules güncellendi (`firestore.rules`)
2. ✅ Admin auth hook oluşturuldu (`use-admin-auth.ts`)
3. ✅ Admin bileşenleri oluşturuldu
4. ✅ AI curriculum generator hazır
5. ✅ Routing için `admin-page.tsx` oluşturuldu
6. ✅ Curriculum prompts dosyası oluşturuldu

## 📋 Manuel Kurulum Adımları

### 1. Firebase Console'da Admin Kullanıcı Oluştur

1. [Firebase Console](https://console.firebase.google.com/) → Projenizi seçin
2. **Authentication** → **Users** sekmesi
3. **Add User** butonuna tıklayın
4. Email ve password girin (örn: `admin@learnconnect.com`)
5. **Add User** ile kullanıcıyı oluşturun
6. **User UID**'yi kopyalayın (örnek: `abc123xyz456...`)

### 2. Firestore'da Admins Koleksiyonu Oluştur

1. Firebase Console → **Firestore Database**
2. **Start collection** → Collection ID: `admins`
3. **Document ID**: Admin kullanıcının UID'sini yapıştırın
4. Aşağıdaki alanları ekleyin:

```json
{
  "email": "admin@learnconnect.com",
  "role": "super_admin",
  "permissions": ["manage_content", "manage_users", "view_analytics"],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Alan Detayları:**
- `email` (string): Admin email adresi
- `role` (string): `"super_admin"` veya `"content_admin"`
- `permissions` (array): `["manage_content", "manage_users", "view_analytics"]`
- `createdAt` (timestamp): Oluşturulma tarihi

### 3. Firestore Rules'u Publish Et

1. Firebase Console → **Firestore Database** → **Rules** sekmesi
2. `firestore.rules` dosyasının içeriğini kopyalayın
3. Rules editörüne yapıştırın
4. **Publish** butonuna tıklayın
5. Değişikliklerin aktif olması birkaç dakika sürebilir

**Kontrol:**
- Rules'da `isAdmin()` fonksiyonu olmalı
- Curriculum için `allow write: if request.auth != null && isAdmin();` olmalı
- Admins koleksiyonu için `allow write: if false;` olmalı

### 4. Routing'e Admin Route Ekle

Wouter kullanıldığı için, routing dosyanızda `/admin` route'unu ekleyin:

**Örnek (wouter ile):**
```typescript
import { Route } from 'wouter';
import AdminPage from '@/pages/admin-page';

// Routing yapılandırmasında:
<Route path="/admin" component={AdminPage} />
```

**Veya location-based routing kullanıyorsanız:**
```typescript
import { useLocation } from 'wouter';
import AdminPage from '@/pages/admin-page';

function App() {
  const [location] = useLocation();
  
  if (location === '/admin') {
    return <AdminPage />;
  }
  // ... diğer route'lar
}
```

**Not:** Projenizin routing yapısına göre uyarlayın. `admin-page.tsx` dosyası hazır ve `AdminDashboard` component'ini render ediyor.

### 5. OpenAI API Key Ekle (Opsiyonel)

AI curriculum generation için:

1. `.env` dosyasına ekleyin:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

2. Vercel'de environment variable olarak ekleyin:
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Key: `OPENAI_API_KEY`
   - Value: OpenAI API key'iniz
   - Environment: Production, Preview, Development (hepsini seçin)

**Not:** OpenAI API key yoksa, endpoint mock data döndürecektir. Bu durumda AI generation çalışmaz ama test için yeterlidir.

## 🧪 Test Adımları

### 1. Admin Authentication Test

1. Tarayıcıda `/admin` sayfasına gidin
2. Admin email ve password ile giriş yapın
3. Admin panel görünmeli
4. Eğer "Access Denied" görürseniz, Firestore'da `admins` koleksiyonunu kontrol edin

### 2. Curriculum CRUD Test

1. Admin panel → **Müfredat** sekmesi
2. TYT seçin
3. **Ders Ekle** ile yeni ders ekleyin (örn: "Matematik")
4. Dersin altına **Konu** ekleyin
5. Konunun altına **Alt Konu** ekleyin
6. TYT Dashboard → **Müfredat** sekmesinde görüntüleyin

### 3. AI Generator Test

1. Admin panel → **AI Asistan** sekmesi
2. **⚡ Tam TYT Müfredatı Oluştur** butonuna tıklayın
3. AI müfredat oluşturmalı (OpenAI key varsa)
4. Preview'da görüntüleyin
5. **Firestore'a Kaydet** ile kaydedin
6. TYT Dashboard'da görüntüleyin

## 🔍 Sorun Giderme

### Admin Login Çalışmıyor
- ✅ Firebase Authentication'da kullanıcı var mı?
- ✅ Firestore'da `admins/{uid}` dokümanı var mı?
- ✅ Firestore Rules publish edildi mi?

### Permission Denied Hatası
- ✅ Firestore Rules'da `isAdmin()` fonksiyonu doğru mu?
- ✅ Admin UID `admins` koleksiyonunda var mı?
- ✅ Rules'u yeniden publish edin

### AI Generation Çalışmıyor
- ✅ OpenAI API key `.env` ve Vercel'de var mı?
- ✅ API endpoint `/api/generate-curriculum` erişilebilir mi?
- ✅ Console'da hata var mı?

### Routing Çalışmıyor
- ✅ `admin-page.tsx` import edildi mi?
- ✅ Route path `/admin` doğru mu?
- ✅ Wouter Router component'i doğru yapılandırıldı mı?

## 📝 Notlar

- Admin koleksiyonu sadece Firebase Console'dan yazılabilir (güvenlik için)
- Curriculum verileri public read, admin write
- OpenAI API key opsiyonel (mock data fallback var)
- Tüm admin işlemleri Firestore Rules ile korunuyor

## ✅ Kurulum Tamamlandı

Tüm adımları tamamladıktan sonra:
1. `/admin` sayfasına gidin
2. Admin credentials ile login olun
3. Curriculum yönetimine başlayın!
