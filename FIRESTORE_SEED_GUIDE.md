# Firestore Seed Script Kullanım Rehberi

## Önkoşullar

1. ✅ Firebase config `.env` dosyasında olmalı
2. ✅ Firebase SDK yüklü olmalı (`npm install` tamamlanmış olmalı)
3. ✅ Firestore Database oluşturulmuş olmalı
4. ✅ Firestore Security Rules yayınlanmış olmalı

## Adımlar

### 1. Firestore Database Oluşturun (Eğer yoksa)

1. [Firebase Console](https://console.firebase.google.com/) → `learnconnect-7c499`
2. **Firestore Database** → **Create database**
3. **Start in test mode** veya **Start in production mode** seçin
4. Location seçin (örn: `europe-west`)
5. **Enable** tıklayın

### 2. Seed Script'i Çalıştırın

```bash
node scripts/firestore-seed.js
```

### 3. Sonuç Kontrolü

Script başarılı olursa şu çıktıyı göreceksiniz:

```
🚀 Starting Firestore seed...
📝 Project: learnconnect-7c499
✅ Added subject: Matematik
   ✅ Topic: Sayılar
   ✅ Topic: Cebir
   ✅ Topic: Geometri
   ✅ Topic: Veri, Sayma, Olasılık
✅ Added subject: Türkçe
   ✅ Topic: Dil Bilgisi
   ✅ Topic: Okuma Anlama
   ✅ Topic: Yazım Kuralları
✅ Added subject: Fen Bilimleri
   ✅ Topic: Fizik
   ✅ Topic: Kimya
   ✅ Topic: Biyoloji
✅ Added subject: Sosyal Bilimler
   ✅ Topic: Tarih
   ✅ Topic: Coğrafya
   ✅ Topic: Felsefe
   ✅ Topic: Din Kültürü

🎉 Firestore seed completed successfully!
```

### 4. Firebase Console'da Kontrol

1. Firebase Console → Firestore Database → Data
2. Şu yapıyı görmelisiniz:
   ```
   curriculum/
     └── tyt/
         └── subjects/
             ├── mathematics
             ├── turkish
             ├── science
             └── social
   ```

## Hata Durumları

### Hata: "Missing or invalid Firebase config"
- `.env` dosyasını kontrol edin
- Firebase config değerlerinin doğru olduğundan emin olun

### Hata: "Firestore is not enabled"
- Firebase Console'dan Firestore Database'i oluşturun

### Hata: "Permission denied"
- Firestore Security Rules'ı kontrol edin
- Rules'ın yayınlandığından emin olun

## Manuel Veri Ekleme (Alternatif)

Seed script çalışmazsa, Firebase Console'dan manuel ekleyebilirsiniz:

1. Firestore Database → **Start collection**
2. Collection ID: `curriculum` → Document ID: `tyt` → **Save**
3. `tyt` document'ına tıklayın → **Start subcollection**
4. Collection ID: `subjects` → Document ID: `mathematics` → **Save**
5. Fields ekleyin:
   - `title` (string): "Matematik"
   - `description` (string): "TYT Matematik müfredatı"
   - `order` (number): 1
   - `totalTopics` (number): 25
   - `estimatedHours` (number): 120
   - `color` (string): "blue"
   - `icon` (string): "🧮"
6. `mathematics` document'ına tıklayın → **Start subcollection**
7. Collection ID: `topics` → Her konu için document ekleyin

## Veri Yapısı

```
curriculum/
  └── tyt/
      └── subjects/ (collection)
          ├── mathematics (document)
          │   ├── title: "Matematik"
          │   ├── description: "..."
          │   ├── order: 1
          │   ├── totalTopics: 25
          │   ├── estimatedHours: 120
          │   ├── color: "blue"
          │   ├── icon: "🧮"
          │   └── topics/ (subcollection)
          │       ├── numbers (document)
          │       ├── algebra (document)
          │       ├── geometry (document)
          │       └── data (document)
          ├── turkish (document)
          ├── science (document)
          └── social (document)
```
