# 🔥 Firestore Security Rules Deploy Rehberi

## Yöntem 1: Firebase CLI ile Deploy (Önerilen)

### Adım 1: Firebase CLI Yükleme

**Eğer Firebase CLI yüklü değilse:**

```bash
npm install -g firebase-tools
```

**Eğer npm SSL hatası alırsanız:**
- Node.js 20.x LTS kullanın (24.x değil)
- Veya Yöntem 2'yi kullanın (Manuel)

### Adım 2: Firebase Login

```bash
firebase login
```

Tarayıcı açılır, Google hesabınızla giriş yapın.

### Adım 3: Firebase Project Seç

```bash
firebase use learnconnect-7c499
```

### Adım 4: Rules Deploy

```bash
firebase deploy --only firestore:rules
```

**Başarılı çıktı:**
```
✔  Deploy complete!
```

---

## Yöntem 2: Firebase Console'dan Manuel Deploy

### Adım 1: Firebase Console'a Git

```
https://console.firebase.google.com/project/learnconnect-7c499/firestore/rules
```

### Adım 2: Rules Dosyasını Aç

Workspace'deki `firestore.rules.production` dosyasını açın.

### Adım 3: İçeriği Kopyala

Tüm içeriği kopyalayın (144 satır).

### Adım 4: Firebase Console'a Yapıştır

1. Firebase Console → Firestore → Rules
2. Mevcut kuralları seçin → **Sil**
3. Yeni kuralları **yapıştırın**

### Adım 5: Publish

**"Publish"** butonuna basın.

**Başarı mesajı:**
```
Rules published successfully
```

---

## ✅ Deploy Sonrası Kontrol

### Test 1: Rules Yayınlandı mı?

Firebase Console → Firestore → Rules

**Göreceksiniz:**
- Rules içeriği görünüyor
- "Last published: [şimdi]" yazıyor

### Test 2: Admin Write İzni

Admin dashboard'dan ders eklemeyi deneyin:
- ✅ Başarılı → Rules çalışıyor
- ❌ "Missing permissions" → Rules deploy edilmemiş veya admin user yok

---

## 🚨 Sorun Giderme

### "firebase: command not found"

**Sebep:** Firebase CLI yüklü değil

**Çözüm:**
```bash
npm install -g firebase-tools
```

**Eğer npm SSL hatası:**
- Yöntem 2'yi kullanın (Manuel deploy)

### "Permission denied"

**Sebep:** Firebase login yapılmamış

**Çözüm:**
```bash
firebase login
```

### "Project not found"

**Sebep:** Yanlış project ID

**Çözüm:**
```bash
firebase projects:list
firebase use learnconnect-7c499
```

---

**ŞİMDİ YAPIN:**

1. Firebase CLI yüklü mü kontrol edin: `firebase --version`
2. Yüklü değilse: `npm install -g firebase-tools`
3. Login: `firebase login`
4. Deploy: `firebase deploy --only firestore:rules`

**VEYA**

Firebase Console'dan manuel deploy yapın (Yöntem 2).
