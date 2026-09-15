# Phase 4: Eğitmen Kursları ve Sertifika Modeli – Plan ve Prototip

Bu doküman, egitim.today stratejisine göre **Faz 4** (Eğitmen Kursları ve Sertifika) için teknik plan ve prototip özetini içerir.

---

## 1. Hedef

- **Udemy/Coursera benzeri** minimal kurs/sunum yapısı
- **Eğitmen arayüzü** (admin/onaylı hesaplar)
- **Jal tamamlama + quiz/ödev sonrası** basit PDF/HTML sertifika
- Platformun gelir modeli ve profesyonel algısı için temel

---

## 2. Firestore Veri Modeli

### 2.1 Yeni Koleksiyonlar

| Koleksiyon       | Açıklama                                  | Ana Alanlar |
|------------------|--------------------------------------------|-------------|
| `courses`        | Eğitmen kursları                          | title, description, instructorId, status, price, createdAt |
| `lessons`        | Kurs dersleri (subcollection veya root)   | courseId, title, order, type, durationMinutes, content |
| `courseEnrollments` | Kullanıcı kayıtları                    | userId, courseId, enrolledAt, progressPercent, completedLessons |
| `certificates`   | Bitirilen yol/kurs için sertifika kayıtları | userId, pathId/courseId, type, issuedAt, metadata |

### 2.2 İlişki Diyagramı (Metin)

```
User (Firebase Auth)
  ├── courseEnrollments[]  → courseId
  ├── certificates[]
  └── userPathProgress[]  (mevcut)

Course (courses)
  ├── instructorId → User
  └── lessons (subcollection veya lessons?courseId=)

Certificate (certificates)
  ├── userId
  ├── pathId | courseId
  └── type: 'path' | 'course'
```

---

## 3. Modül Bazlı Teknik Plan

### 3.1 Kurs Modülü (Courses)

**Firestore:**

```javascript
// courses/{courseId}
{
  title: string,
  description: string,
  instructorId: string,
  instructorName: string,
  status: 'draft' | 'published',
  price: number | null,  // 0 = ücretsiz
  thumbnailUrl?: string,
  estimatedHours: number,
  tags: string[],
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// lessons (subcollection: courses/{courseId}/lessons/{lessonId})
{
  title: string,
  order: number,
  type: 'video' | 'text' | 'quiz',
  durationMinutes: number,
  content: string,  // URL veya HTML
  quizQuestions?: array  // quiz tipi için
}
```

**API / Service:**
- `getCourses(filters?)` – listeleme
- `getCourseById(id)` – detay
- `createCourse`, `updateCourse` – sadece instructor/admin
- `enrollUser(userId, courseId)`
- `completeLesson(userId, courseId, lessonId)` – progress güncelle

### 3.2 Eğitmen Arayüzü

- **Rol:** `instructor` veya admin
- **Sayfalar:**
  - `/instructor/courses` – kurs listesi
  - `/instructor/courses/new` – yeni kurs
  - `/instructor/courses/:id` – düzenleme, ders ekleme
- **Firestore rules:**
  - `courses`: create/update/delete → `request.auth.uid == resource.data.instructorId || isAdmin()`
  - `lessons`: aynı mantık (parent course üzerinden)

### 3.3 Sertifika Modülü (Certificates)

**Firestore:**

```javascript
// certificates/{certificateId}
{
  userId: string,
  userName: string,
  type: 'path' | 'course',
  pathId?: string,
  courseId?: string,
  pathTitle?: string,
  courseTitle?: string,
  issuedAt: Timestamp,
  expiresAt?: Timestamp,
  metadata: { progressPercent, completedSteps?, completedLessons? }
}
```

**API / Service:**
- `issueCertificate(userId, type, pathId|courseId)` – path tamamlandığında veya kurs bittiğinde
- `getUserCertificates(userId)`
- `verifyCertificate(certificateId)` – public doğrulama (mevcut certificate-verify sayfasına bağlanır)

**Sertifika Çıktısı:**
- HTML/PDF: basit şablon (logo, ad, tarih, yol/kurs adı)
- Mevcut `certificates.tsx` ve `certificate-verify.tsx` sayfaları bu modele bağlanır

---

## 4. Prototip Bileşenleri (MVP)

### 4.1 Yapılacaklar (Öncelik Sırasına Göre)

1. **Firestore şeması**
   - `courses`, `lessons`, `courseEnrollments`, `certificates` koleksiyonları
   - Firestore rules güncellemesi

2. **Sertifika entegrasyonu (önce)**
   - Path tamamlandığında otomatik `certificates` kaydı
   - `certificates.tsx` → Firestore `certificates` koleksiyonundan okuma
   - `certificate-verify.tsx` → ID ile doğrulama

3. **Minimal kurs listesi**
   - `/courses` sayfası: Firestore `courses` koleksiyonundan okuma
   - Kartlar: başlık, açıklama, eğitmen, süre

4. **Eğitmen paneli (sonra)**
   - `/instructor` route
   - Kurs oluşturma/düzenleme formu
   - Ders ekleme (sıralı liste)

### 4.2 Mevcut Altyapıyla Uyum

- `client/src/pages/courses.tsx` – placeholder; Firestore `courses` ile doldurulacak
- `client/src/pages/certificates.tsx` – Firestore `certificates` ile bağlanacak
- `client/src/pages/certificate-verify.tsx` – doğrulama endpoint’i veya direkt Firestore read

---

## 5. Sertifika Çıkarma Akışı (Detay)

```
Path tamamlandı (progressPercent === 100)
  → learningPathsService veya paths.tsx'te kontrol
  → certificatesService.issueCertificate(userId, 'path', pathId)
  → certificates koleksiyonuna yaz
  → (Opsiyonel) toast: "Tebrikler! Sertifikan hazır."
```

**Sertifika şablonu (HTML):**
- egitim.today logosu
- "Bu sertifika [Ad]'in [Yol Adı] yolunu tamamladığını doğrular."
- Tarih
- Benzersiz ID (doğrulama için)

---

## 6. Firestore Rules Taslağı

```javascript
match /courses/{courseId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && 
    (get(/databases/$(database)/documents/instructors/$(request.auth.uid)).data.active == true || isAdmin());
  allow update, delete: if request.auth != null && 
    (resource.data.instructorId == request.auth.uid || isAdmin());
  match /lessons/{lessonId} {
    allow read: if request.auth != null;
    allow write: if request.auth != null && 
      (get(/databases/$(database)/documents/courses/$(courseId)).data.instructorId == request.auth.uid || isAdmin());
  }
}

match /courseEnrollments/{enrollmentId} {
  allow read, write: if request.auth != null;
}

match /certificates/{certId} {
  allow read: if true;  // Public verification
  allow create: if request.auth != null;
  allow update, delete: if false;
}
```

---

## 7. Tahmini Süre

| Bileşen                 | Süre      |
|-------------------------|-----------|
| Firestore şema + rules  | 1–2 gün   |
| certificatesService     | 1 gün     |
| Path → sertifika akışı  | 0.5 gün   |
| courses sayfası (list)   | 1 gün     |
| Eğitmen paneli (minimal)| 3–4 gün   |
| Ders izleme / progress  | 2–3 gün   |
| **Toplam (MVP)**        | **~2 hafta** |

---

## 8. Sonraki Somut Adım

1. Firestore’da `certificates` koleksiyonunu ve rules’u ekle
2. `certificatesService.ts` oluştur
3. `paths.tsx` içinde path %100 tamamlandığında `issueCertificate` çağır
4. `certificates.tsx` ve `certificate-verify.tsx` sayfalarını Firestore’a bağla
