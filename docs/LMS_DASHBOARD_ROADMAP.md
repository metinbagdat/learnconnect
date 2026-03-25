# LMS Dashboard — rol tabanlı yol haritası (Egitim.today / LearnConnect)

**Hedef:** “50 modüllü LMS” değil; **3 ana ekran + AI** ile **%80 değer** — hızlı, sade, **AI-first öğrenme işletim sistemi** hissi.

**Stack varsayımı:** React (Vite), Supabase (auth, DB, storage), Vercel, mevcut çalışma takip modülü ile uyumlu genişleme.

---

## 1. Prensipler (golden rules)

| Kural | Uygulama |
|--------|-----------|
| Rol başına **tek ana sayfa** (MVP) | Öğrenci: 6 widget; Eğitmen: 5 blok; Admin: 6 blok — önce bunlar. |
| **Widget / kart** mimarisi | Sonra sürükle-bırak kişiselleştirme (Phase 3+). |
| **Gerçek zamanlı his** | Cache var ama “son aktivite / bugünün odağı” güncel. |
| **Öğrenme → ödeme → retention** | Dashboard süs değil; devam, ödeme, tekrar oturumu. |

---

## 2. Rol bazlı modül seti (özet)

### 2.1 Öğrenci (Learner)

| Öncelik | Modül | MVP’de |
|---------|--------|--------|
| P0 | **Current focus** — “Bu hafta / bugün ne?” | Evet |
| P0 | **Devam eden kurslar** — ilerleme %, kaldığı yer | Evet |
| P0 | **Task tracker** — ödev / sınav / etkinlik tarih sırası | Evet |
| P0 | **Global progress** — program veya ders bazlı bar | Evet |
| P1 | **Quick resume** — son derse tek tık | Evet |
| P1 | **Streak / motivasyon** | Evet (hafif) |
| P2 | Duyurular & bildirimler | Phase 2 |
| P2 | Rozet / sertifika özeti | Phase 2 |
| P2 | Kişisel hedefler (Goals widget) | Phase 2–3 |
| P3 | İletişim & destek blokları | İsteğe bağlı |

**MVP paket:** Yukarıdaki 6–7 widget = tek öğrenci dashboard sayfası.

### 2.2 Eğitmen / öğretmen (Instructor)

| Öncelik | Modül | MVP’de |
|---------|--------|--------|
| P0 | **Kurs kontrol kartları** — kurs sayısı, yayın durumu | Lean v1 |
| P0 | **Bekleyen aksiyonlar** — puanlanacak ödev/sınav sayısı | Evet |
| P0 | **Risk altındaki öğrenciler** — düşük ilerleme / inaktif | Evet (basit kural) |
| P1 | **Hızlı eylemler** — yeni içerik, duyuru, quiz | Evet |
| P1 | **Basit kurs analitiği** — en zor konu / çıkış noktaları | Basit |
| P2 | Yorum & soru akışı | Phase 3 |

### 2.3 Yönetici / süper admin

| Öncelik | Modül | MVP’de |
|---------|--------|--------|
| P0 | **Özet KPI** — kullanıcı, aktif öğrenci, yeni kayıt | Evet |
| P0 | **Gelir & siparişler** (e-ticaret varsa) | Entegrasyon varsa |
| P1 | **En iyi kurslar / tamamlanma** | Basit tablo |
| P1 | **Günlük aktif kullanıcı (DAU) / oturum** | Basit |
| P2 | Uyumluluk, sertifika süresi, hata logları | Phase 3 |
| P2 | Rapor merkezi (kayıtlı rapor, CSV) | Phase 3 |

### 2.4 E-ticaret (ayrı veya admin alt sekmesi)

- Ödeme hunisi: sepet → ödeme → tamamlanan (basit sayılar).
- Bekleyen ödemeler listesi.
- **Not:** Ödeme altyapısı (Stripe/iyzico vb.) yoksa bu blok “placeholder + manuel” ile başlar.

### 2.5 AI dashboard (süper admin veya öğrenci içinde gömülü)

| Modül | Açıklama | Faz |
|--------|-----------|-----|
| **Öğrenci beyin haritası** | Güçlü/zayıf konular (mevcut study_logs / quiz verisi) | 2–3 |
| **Otomatik çalışma planı** | Haftalık plan önerisi | 2–3 |
| **Dropout riski** | Basit skor (aktivite + puan) | 3 |
| **İçerik optimizasyonu** | Düşük tamamlanan dersler | 3 |

İlk aşamada AI, **öğrenci dashboard** içinde **tek öneri kartı** (zaten çalışma takipte günlük görev benzeri) olarak yeterli.

---

## 3. Faz planı (uygulama sırası)

### Phase 1 — 1–2 hafta (çekirdek UX + para hissi)

**Hedef:** Tek öğrenci ekranı + admin’de sipariş/gelir görünürlüğü (altyapı varsa).

1. **Öğrenci dashboard (1 sayfa, 6 widget)**  
   - Current focus (statik + sonra AI/progress birleşimi)  
   - Global progress bar(lar)  
   - Task tracker (elle veya DB’den)  
   - Smart recommendation (1 kart — kural tabanlı bile olur)  
   - Quick resume  
   - Streak (mevcut çalışma takip streak’i genişletilebilir)

2. **Checkout / ödeme** — zaten varsa sadece **admin’de özet** bağlayın.

3. **Admin:** Gelir özeti + bekleyen sipariş sayısı (veri yoksa mock → sonra gerçek API).

4. **Teknik:** Supabase tabloları: `enrollments`, `assignments`, `announcements` (minimal şema); mevcut `students` / `study_logs` ile köprü.

### Phase 2 — Retention (2–4 hafta)

- Bildirimler & duyurular  
- Görev sistemi (öğretmen atar → öğrenci task tracker’da görür)  
- İlerleme senkronu (ders tamamlama %)  
- Streak ve günlük hatırlatma (push/email sonra)

### Phase 3 — Ölçek & eğitmen

- Eğitmen dashboard (5 modül) tam veri  
- Raporlar (CSV export)  
- AI: risk + plan + içerik önerisi (Groq / mevcut API desenleri)

### Phase 4 — Kişiselleştirme

- Widget sırası / gizleme  
- Adaptif öğrenme yolu (veri birikince)

---

## 4. Mevcut repo ile hizalama

| Bileşen | Durum |
|---------|--------|
| Çalışma takip (`/calisma-takip`) | Streak, görev, grafik, hedef — **öğrenci MVP** ile birleştirilebilir. |
| Supabase | Auth + DB; yeni tablolar: enrollment, course, assignment. |
| Edge Functions | AI görev üretimi — **Current focus / öneri** kartına genişletilebilir. |

---

## 5. Kaçınılacak hatalar

- ❌ 50 modülü aynı anda kodlamak  
- ❌ Moodle kopyası (kapsam şişer)  
- ✅ **3 ekran** (öğrenci / eğitmen / admin) önce net; geri kalan modül **backlog**

---

## 6. Sonraki somut adım (öneri)

1. **Ürün:** Öğrenci MVP için 6 widget’ın wireframe + veri alanları (1 sayfa Notion/Figma).  
2. **DB:** `courses`, `enrollments`, `modules_progress` minimal migration.  
3. **Kod:** `/ogrenci` veya `/panel` altında tek route; çalışma takip bileşenlerini yeniden kullan.

Bu doküman canlıdır; faz tarihleri ekibin hızına göre güncellenir.
