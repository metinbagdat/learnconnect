# 🚀 Admin Dashboard - Hızlı Başlangıç

## ✅ Kurulum Tamamlandı!

Admin dashboard artık hazır ve `http://localhost:5175/admin` adresinden erişilebilir.

---

## 📍 Erişim

```bash
Ana Sayfa:      http://localhost:5175/
Admin Panel:    http://localhost:5175/admin
```

---

## 🔐 İlk Giriş İçin

### 1. Sunucuyu Yeniden Başlatın

Eski terminali kapatın (`Ctrl+C`) ve yeni sunucuyu başlatın:

```bash
npm run dev
```

Ardından tarayıcıda açın: **http://localhost:5175/admin**

### 2. Firebase Console'da Admin Kullanıcısı Oluşturun

Detaylı rehber için: [`FIREBASE_ADMIN_SETUP_GUIDE.md`](FIREBASE_ADMIN_SETUP_GUIDE.md)

**Hızlı Adımlar:**

```
1. https://console.firebase.google.com/
2. Authentication → Users → "Add User"
   Email: admin@learnconnect.com
   Password: [Güvenli şifre]
   
3. UID'yi kopyala

4. Firestore → "Start collection" → "admins"
   Document ID: [UID]
   Fields:
     - email: "admin@learnconnect.com" (string)
     - role: "super_admin" (string)
     - permissions: ["manage_content", "manage_users", "view_analytics"] (array)
     - createdAt: [now] (timestamp)
     - isActive: true (boolean)
     
5. Save & Publish Rules
```

### 3. Giriş Yapın

```
URL: http://localhost:5175/admin
Email: admin@learnconnect.com
Password: [Firebase'de oluşturduğunuz şifre]
```

---

## 🎯 Test Adımları

### ✅ Checklist

```bash
□ Vite sunucusu çalışıyor (npm run dev)
□ http://localhost:5175/admin açılıyor
□ Firebase'de admin kullanıcısı oluşturuldu
□ Firestore'da admins/{uid} dokümanı var
□ Admin login başarılı
□ Curriculum tab açılıyor
□ Users tab açılıyor
□ Analytics tab açılıyor
□ AI tab açılıyor
```

### 🧪 İlk Testler

1. **AI ile Müfredat Oluştur**
   - AI tab → "TYT Matematik Full Müfredat"
   - "Müfredat Oluştur" → Bekle (10-15s)
   - "Firestore'a Kaydet"

2. **Curriculum Kontrol**
   - Curriculum tab → TYT seçili
   - Oluşturulan dersleri gör
   - Bir derse tıkla → Konuları aç

3. **Manuel Ders Ekle**
   - "Ders Ekle" butonu
   - Ders bilgilerini gir
   - Kaydet

---

## 🚨 Sorun Giderme

### Sayfa Yüklenmiyor?

```bash
# 1. Sunucuyu yeniden başlat
Ctrl+C (terminalde)
npm run dev

# 2. Browser cache temizle
Ctrl+Shift+R (hard refresh)

# 3. Console hatalarını kontrol et
F12 → Console tab
```

### "Permission Denied"?

```bash
# Firestore'da admin dokümanını kontrol et
1. Firebase Console → Firestore
2. admins/{uid} dokümanı var mı?
3. UID, Authentication'daki kullanıcıyla aynı mı?
4. Rules publish edildi mi?
```

### Login Çalışmıyor?

```bash
# Email/şifre doğru mu?
1. Firebase Console → Authentication
2. Kullanıcı listesinde var mı?
3. Email verified olarak işaretli mi?
```

---

## 📦 Özellikler

### ✅ Hazır Özellikler

- **Real-Time Updates** - Firestore `onSnapshot` ile canlı veri
- **Role-Based Access** - Super admin, content admin, viewer
- **Audit Logs** - Tüm admin işlemlerinin kaydı
- **Email Notifications** - Kullanıcı bildirimleri
- **Backup System** - Otomatik Firestore backup
- **Advanced Charts** - CSS-based visualizations
- **AI Curriculum Generator** - TYT/AYT müfredat üretimi
- **AI Study Plan** - Kişiselleştirilmiş çalışma planları

### 📊 Admin Tabs

1. **Curriculum** - Müfredat yönetimi
2. **Users** - Kullanıcı yönetimi
3. **Analytics** - İstatistikler
4. **AI** - AI araçları

---

## 🔑 Admin Rolleri

| Rol | Yetki |
|-----|-------|
| **super_admin** | Tüm yetkiler |
| **content_admin** | Sadece müfredat yönetimi |
| **viewer** | Sadece görüntüleme |

---

## 📝 Yapılacaklar

```bash
✅ Admin dashboard kuruldu
✅ Tüm component'ler eklendi
✅ Real-time updates hazır
✅ Role-based access hazır
✅ Audit logs hazır
✅ Backup system hazır

⏳ Firebase'de admin kullanıcısı oluştur
⏳ İlk giriş yap
⏳ AI ile müfredat oluştur
⏳ Production'a deploy et
```

---

## 🚀 Production Deploy

```bash
# 1. Build test
npm run build

# 2. Environment variables (Vercel)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
OPENAI_API_KEY=sk-...

# 3. Deploy
git add .
git commit -m "feat: admin dashboard with advanced features"
git push origin main
```

---

## 📚 Dokümantasyon

- **Detaylı Setup:** [`FIREBASE_ADMIN_SETUP_GUIDE.md`](FIREBASE_ADMIN_SETUP_GUIDE.md)
- **API Docs:** `api/` klasöründeki dosyalar
- **Component Docs:** `src/components/admin/` içindeki dosyalar

---

## 🎉 Başarıyla Tamamlandı!

Admin dashboard artık kullanıma hazır! 🚀

**Sonraki adım:** http://localhost:5175/admin adresine gidin!
