# Firestore Security Rules Setup

## Adımlar

### 1. Firebase Console'a Gidin
1. [Firebase Console](https://console.firebase.google.com/) → `learnconnect-7c499` projesi
2. Sol menüden **Firestore Database** seçin
3. **Rules** sekmesine tıklayın

### 2. Rules Dosyasını Yapıştırın
`firestore.rules` dosyasının içeriğini kopyalayıp Firebase Console'daki editör'e yapıştırın:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Curriculum data - public read, authenticated write
    match /curriculum/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // User progress - user can read/write own data
    match /user_progress/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Study plans - user can read/write own data
    match /study_plans/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // AI plans - user can read/write own data
    match /ai_plans/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3. Publish
1. **Publish** butonuna tıklayın
2. Onaylayın

### 4. Test (Opsiyonel)
Rules'ı test etmek için Firebase Console'da **Rules Playground** kullanabilirsiniz.

## Önemli Notlar

⚠️ **Development için:** Rules şu anda curriculum için public read izni veriyor. Production'da daha sıkı kurallar uygulayın.

✅ **Production için:** Authentication kontrolü ekleyin ve sadece yetkili kullanıcıların yazmasına izin verin.
