# API ve Firestore Düzeltme Rehberi

Bu doküman, egitim.today için eksik API endpoint'lerini ve Firestore kurallarını nasıl düzelteceğini açıklar.

---

## 1. Backend API – Durum ve Eksikler

### Vercel Nasıl Çalışıyor

- **Static**: `dist` (Vite build) → HTML, JS, CSS
- **API**: `api/` klasöründeki her dosya bir serverless function olur:
  - `api/user.js` → `/api/user`
  - `api/health.js` → `/api/health`
  - `api/ai-plan.js` → `/api/ai-plan`
  - `api/ai/*.js` → `/api/ai/*`

- **Express sunucusu (`server/routes.ts`, `server/auth.ts`)** Vercel’de deploy edilmiyor. 100+ route sadece local `npm run dev` sırasında çalışıyor.

### Client’ın Beklediği Endpoint’ler vs Mevcut Durum

| Endpoint | Client Kullanımı | api/ Klasöründe | Durum |
|----------|------------------|-----------------|-------|
| `GET /api/user` | `use-auth`, App.tsx | `api/user.js` | ✅ Var (demo veri döner) |
| `POST /api/login` | `login.tsx` | Yok | ❌ 404 |
| `POST /api/logout` | `use-auth`, MainNavbar | Yok | ❌ 404 |
| `POST /api/register` | `register.tsx` | Yok | ❌ 404 |
| `GET /api/tyt/profile` | `tyt-dashboard.tsx` | Yok | ❌ 404 |
| `GET /api/tyt/subjects` | `tyt-dashboard.tsx` | Yok | ❌ 404 |
| `GET /api/tyt/trials` | `tyt-dashboard.tsx` | Yok | ❌ 404 |
| `GET /api/tyt/tasks` | `tyt-dashboard.tsx` | Yok | ❌ 404 |
| `GET /api/tyt/stats` | `tyt-dashboard.tsx` | Yok | ❌ 404 |
| `POST /api/tyt/tasks/:id/complete` | `tyt-dashboard.tsx` | Yok | ❌ 404 |
| `POST /api/tyt/tasks/batch` | `ai-plan-generator.tsx` | Yok | ❌ 404 |
| `GET /api/teacher/classes` | `teacher-dashboard.tsx` | Yok | ❌ 404 |

### Çözüm Seçenekleri

**A) Express’i Vercel’e Taşımak (Önerilen)**

Express uygulamasını tek bir catch-all serverless function olarak çalıştır:

1. `api/[[...path]].js` veya `api/index.js` oluştur
2. Bu dosya `server/routes.ts` ve `server/auth.ts`’i mount eden Express app’i export etsin
3. Vercel, `/api/*` isteklerini bu handler’a yönlendirir

Örnek `api/[[...path]].ts` (veya `.js`):

```js
// api/[[...path]].js - Vercel catch-all for Express
import app from '../server/app.js'; // veya server'ı başlatan entry

export default async function handler(req, res) {
  // Express app'i serverless'da çalıştır
  return app(req, res);
}
```

Not: `server/` TypeScript olduğu için build sırasında compile edilip `api/` handler’a bağlanması gerekir. Proje yapısına göre `build-vercel-api.js` veya benzeri script kullanılıyor olabilir – mevcut build pipeline’ı kontrol et.

**B) Eksik Endpoint’ler İçin Ayrı Serverless Function’lar**

Her eksik path için `api/` altında ayrı dosya ekle:

- `api/login.js` → `POST /api/login`
- `api/logout.js` → `POST /api/logout`
- `api/register.js` → `POST /api/register`
- `api/tyt/subjects.js` → `GET /api/tyt/subjects`
- `api/tyt/profile.js` → `GET /api/tyt/profile`
- … (diğer tyt, teacher endpoint’leri)

Her biri `server/routes.ts` veya `server/auth.ts`’teki ilgili handler’ı çağıracak şekilde yazılmalı. Bu yol daha fazla dosya gerektirir ama adım adım ilerlenebilir.

---

## 2. Firestore Kuralları

### Mevcut Durum

`firestore.rules` dosyasında `notes`, `studyStats`, `learningPaths`, `userPathProgress` için kurallar tanımlı. Hepsi `request.auth != null` istiyor.

### Önemli Nokta: Firebase Auth vs Express Session

- Dashboard, notlar, stats, paths için client **doğrudan Firestore** kullanıyor (`notesService`, `studyStatsService`, `learningPathsService`).
- Firestore Security Rules, `request.auth` ile çalışır – yani **Firebase Authentication** kullanıcısı gerekir.
- Eğer login sadece Express session (`/api/login`) ile yapılıyorsa ve Firebase Auth kullanılmıyorsa, `request.auth` null olur ve Firestore erişimi reddedilir.

### Çözümler

**Seçenek 1: Firebase Auth ile Giriş (Önerilen)**

Login/register akışında Firebase Auth kullan; session sadece ek bilgi için kalsın. Böylece Firestore `request.auth` dolu olur.

**Seçenek 2: Kuralları Geçici Gevşetmek (Sadece Test)**

Sadece test için, sadece okuma izni ver:

```
match /notes/{noteId} {
  allow read: if true;  // Geçici – production'da kaldır
  allow write: if request.auth != null;
}
```

Production’da `read: if true` kullanma; güvenlik riski oluşturur.

**Seçenek 3: Backend API ile Firestore**

Client Firestore’a direkt erişmesin; `/api/notes`, `/api/stats`, `/api/paths` gibi endpoint’ler ekle. Backend, Express session ile kullanıcıyı doğrular ve Firestore Admin SDK ile okur/yazar. Bu durumda Firestore rules’da bu koleksiyonlara client erişimini kapatman gerekir.

### Güncel Firestore Rules Örneği

Mevcut `firestore.rules` zaten uygun. Eğer Firebase Auth ile giriş yapıyorsan değişiklik gerekmez. Auth yoksa önce login’i Firebase Auth’e taşı.

```javascript
// firestore.rules – mevcut yapı uygun
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notes/{noteId} {
      allow read, write: if request.auth != null;
    }
    match /studyStats/{statId} {
      allow read, write: if request.auth != null;
    }
    match /learningPaths/{pathId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && isAdmin();
    }
    match /userPathProgress/{progressId} {
      allow read, write: if request.auth != null;
    }
    // ... diğer kurallar
  }
}
```

### Firebase Console’da Uygulama

1. https://console.firebase.google.com/project/learnconnect-7c499/firestore/rules
2. **Rules** sekmesi → **Edit rules**
3. `firestore.rules` içeriğini yapıştır (veya gerekli değişiklikleri yap)
4. **Publish**

---

## 3. Özet ve Sıra

1. **API 404’leri**: Express’i Vercel’e bağla (catch-all veya ayrı function’lar) – login, logout, register, tyt endpoints çalışsın.
2. **Firestore izinleri**: Login’i Firebase Auth ile yap veya backend API’ler ekle; `request.auth` veya session ile doğrulama sağla.
3. **Firestore Rules**: Firebase Console’da Rules’u güncelleyip Publish et.

Sorularınız veya belirli bir adımda takılırsanız, hangi adımda olduğunuzu yazın.
