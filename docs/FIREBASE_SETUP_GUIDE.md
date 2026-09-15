# Firebase Setup Guide

## 1. Firebase Environment Variables

`.env` dosyanıza aşağıdaki Firebase konfigürasyon değişkenlerini ekleyin:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 2. Firebase Console Setup

1. [Firebase Console](https://console.firebase.google.com/)'a gidin
2. Yeni bir proje oluşturun veya mevcut projeyi seçin
3. Project Settings > General > Your apps bölümünden Web app ekleyin
4. Config değerlerini kopyalayıp `.env` dosyasına yapıştırın

## 3. Firestore Setup

Firestore Database oluşturun:

1. Firebase Console > Build > Firestore Database
2. Production mode veya Test mode seçin (Test mode development için yeterli)
3. Veritabanını oluşturun

## 4. Firestore Security Rules

Firestore Rules'ı güncelleyin (`firestore.rules`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Curriculum data - public read, admin write
    match /curriculum/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // User progress - user can read/write own data
    match /user_progress/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Study plans - user can read/write own data
    match /study_plans/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 5. Install Firebase SDK

```bash
npm install firebase
```

Eğer SSL hatası alırsanız:

```bash
npm install firebase --registry https://registry.npmjs.org/
```

veya

```bash
npm config set registry https://registry.npmjs.org/
npm install firebase
```

## 6. Firestore Data Structure

Firestore'da şu yapıyı oluşturun:

```
curriculum/
  └── tyt/
      └── subjects/  (collection)
          ├── mathematics (document)
          │   ├── title: "Matematik"
          │   ├── description: "TYT Matematik müfredatı"
          │   ├── order: 1
          │   ├── totalTopics: 25
          │   ├── estimatedHours: 120
          │   ├── color: "blue"
          │   ├── icon: "🧮"
          │   └── topics/ (subcollection)
          │       ├── algebra (document)
          │       │   ├── name: "Cebir"
          │       │   ├── order: 1
          │       │   ├── estimatedTime: 25
          │       │   └── subtopics/ (subcollection)
          │       └── geometry (document)
          └── turkish (document)
              └── ...
```

## 7. Seed Data (Optional)

`scripts/firestore-seed.ts` dosyasını kullanarak örnek veri ekleyebilirsiniz.

## 8. Vercel Environment Variables

Production için Vercel'de environment variables ekleyin:

1. Vercel Dashboard > Project > Settings > Environment Variables
2. Her bir `VITE_FIREBASE_*` değişkenini ekleyin
3. Production, Preview ve Development için aynı değerleri ayarlayın

## Notlar

- `.env` dosyası git'e commit edilmemeli (`.gitignore`'da olmalı)
- Production'da Vercel environment variables kullanılmalı
- Firestore'da veri yoksa mock data gösterilecek (fallback mevcut)
