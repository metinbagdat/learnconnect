# 🚀 Firestore Quick Start - 5 Dakikada Hazır

## Adım 1: Firestore Database Oluştur (2 dk)

1. [Firebase Console](https://console.firebase.google.com/) → `learnconnect-7c499`
2. **Firestore Database** → **Create database**
3. **Production mode** seçin
4. Location: `europe-west` (veya size yakın)
5. **Enable** tıklayın

## Adım 2: Rules Yükle (1 dk)

1. **Rules** sekmesi
2. `FIREBASE_CONSOLE_RULES_COPY.txt` dosyasını açın
3. İçeriği kopyalayıp yapıştırın
4. **Publish** tıklayın

## Adım 3: Veri Ekle (2 dk)

### Yöntem A: Browser Console (Önerilen)

1. `npm run dev` çalıştırın
2. Browser'da uygulamayı açın
3. F12 → Console
4. `BROWSER_CONSOLE_SEED.js` dosyasının içeriğini kopyalayıp yapıştırın
5. Enter

### Yöntem B: Manuel (Alternatif)

Firebase Console → Firestore → Data → Start collection:
- Collection: `curriculum` → Document: `tyt` → Subcollection: `subjects`
- Her ders için document ekleyin

## ✅ Kontrol

Firebase Console → Firestore → Data'da şunu görmelisiniz:
```
curriculum/
  └── tyt/
      └── subjects/
          ├── mathematics
          ├── turkish
          ├── science
          └── social
```

## 🎉 Tamamlandı!

Artık uygulamanız Firestore'dan gerçek veri çekebilir!
