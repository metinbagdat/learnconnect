# egitim.today – Modern Eğitim Platformu Arayüz Dönüşüm Planı

Bu doküman, siteyi modern bir eğitim platformu arayüzüne dönüştürmek için strateji, Dashboard UX iyileştirmeleri ve gerçek kullanıcı akışlarını içerir.

---

## 1. Genel Vizyon

**Hedef:** Khan Academy, Coursera, Patika.dev tarzı temiz, odaklı ve öğrenci-merkezli bir deneyim.

**Tasarım Prensipleri:**
- Açık hiyerarşi, 2–3 ana renk, bol boşluk
- Küçük ama anlamlı animasyonlar (progress, streak)
- Minimum sürtünme: tek tıkla not, görev tamamlama
- Mobil-first, responsive

---

## 2. Vite & Build (Tamamlandı)

- [x] `vite.config.ts` sadeleştirildi
- [x] Tek `vendor` chunk (React + tüm bağımlılıklar)
- [x] CSS: Tailwind preflight kapalı, `-webkit-text-size-adjust` yok

---

## 3. Dashboard UX İyileştirmeleri

### 3.1 Öncelikli Değişiklikler

| Özellik | Mevcut | Hedef |
|--------|--------|-------|
| Hoş geldin mesajı | Statik "45 dk" hedef | Dinamik hedef (aktif yol + bugünkü adım) |
| İstatistik kartları | Basit sayılar | Mikro animasyon, progress ring |
| Aktif yollar | Liste | Kartlar + "Devam et" CTA + son adım bilgisi |
| Hızlı not | Textarea | Inline expand, tag önerileri |
| Son notlar | Liste | Hover preview, yol ilişkisi badge |

### 3.2 Görsel İyileştirmeler

- **Renk paleti:** Ana mavi (#2563eb), vurgu mor (#7c3aed), başarı yeşili (#059669)
- **Kartlar:** Hafif gölge, hover:scale(1.01), border-radius: 12px
- **Progress:** Gradient bar, tamamlandığında check animasyonu
- **Boş durumlar:** İllüstrasyon + net CTA (örn. "İlk yolunu başlat")

### 3.3 Mobil

- Bottom nav: 4 öğe (Ana Sayfa, Defter, Yollar, Profil)
- Kartlar: tam genişlik, dokunmatik dostu
- Hızlı not: modal veya slide-up panel

---

## 4. Gerçek Kullanıcı Akışları

### 4.1 Öğrenci → Kurs → Görev → Rapor

```
[Giriş] → [Dashboard]
    ↓
[Öğrenme Yolları] veya [Kurslar]
    ↓
[Yol/Kurs Detay] → Adımlar listesi
    ↓
[Adım/Görev] → İçerik + "Tamamla"
    ↓
[İlerleme güncellenir] → Dashboard'da görünür
    ↓
[%100] → Sertifika
```

**Veri akışı:**
- `userPathProgress` / `courseEnrollments` → ilerleme
- `studyStats` → günlük çalışma süresi, streak
- `notes` → relatedPathId ile yol/kursa bağlı notlar
- `certificates` → tamamlanan yol/kurs

### 4.2 Not → Yol İlişkisi

```
[Defterim] → Not oluştur/düzenle
    ↓
[Öğrenme Yolu seç] (dropdown)
    ↓
Not kaydedilir (relatedPathId)
    ↓
[Dashboard] Son notlar → yol badge'i
[Yol detay] → İlgili notlar listesi (gelecek)
```

### 4.3 Topluluk Paylaşımı

```
[Defter] veya [Yol adımı tamamlandı]
    ↓
[Toplulukta Paylaş]
    ↓
[Community] → Pre-filled form → Paylaş
    ↓
Feed'de görünür
```

---

## 5. Sayfa Bazlı UX Hedefleri

| Sayfa | Öncelik | İyileştirme |
|-------|---------|--------------|
| Dashboard | Yüksek | Dinamik hedef, progress ring, boş durum CTA |
| Öğrenme Yolları | Yüksek | Yol kartları, filtre (TYT/Yazılım), arama |
| Defterim | Orta | Tag önerileri, yol ilişkisi, arama |
| Kurslar | Orta | Liste + placeholder (Phase 4'e hazırlık) |
| Topluluk | Orta | Feed sıralama, filtre (tag) |
| Profil | Düşük | İstatistik özeti, sertifikalar linki |

---

## 6. Teknik Uygulama Sırası

1. **Dashboard:** Dinamik hedef, progress ring, kart animasyonları
2. **Yollar sayfası:** Kategori filtre, kart tasarımı
3. **Defter:** Tag autocomplete, yol badge
4. **Global:** Loading skeleton, toast bildirimleri
5. **Profil:** Özet istatistikler

---

## 7. Tasarım Sistemi (Önerilen)

```css
/* Ana renkler */
--primary: 220 90% 56%;
--primary-foreground: 0 0% 100%;
--accent: 262 83% 58%;
--success: 160 84% 39%;
--muted: 220 14% 96%;

/* Spacing */
--radius: 12px;
--card-padding: 1.5rem;
```

---

## 8. Sonraki Adımlar

1. Dashboard bileşenlerini güncelle (progress ring, dinamik hedef)
2. Yollar sayfasına kategori filtre ekle
3. Defter'e tag önerisi (getUserTags ile)
4. PHASE4_INSTRUCTOR_COURSE_PLAN.md ile kurs modülüne geç
