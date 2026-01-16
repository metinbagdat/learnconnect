# Vercel'e Domain Ekleme Adımları

## Manuel Adımlar (Vercel Dashboard)

1. **Vercel Dashboard'a Git**
   - https://vercel.com/dashboard
   - `learn-connect` projesini seç

2. **Settings → Domains**
   - Sol menüden "Settings" → "Domains" sekmesine git

3. **Domain Ekle**
   - "Add Domain" butonuna tıkla
   - `egitim.today` yaz ve "Add" butonuna tıkla

4. **DNS Talimatlarını Takip Et**
   - Vercel sana DNS kayıtlarını gösterecek
   - Bu kayıtları domain sağlayıcına ekle (DNS_FIX_INSTRUCTIONS.md'deki talimatlara göre)

5. **www Alt Domaini Ekle (Opsiyonel)**
   - `www.egitim.today` ekle
   - "Redirect to egitim.today" seçeneğini aç

6. **SSL Sertifikası Bekle**
   - Domain eklendikten sonra Vercel otomatik SSL oluşturur
   - 5-15 dakika içinde "Valid" durumuna geçer

## Vercel CLI ile Domain Ekleme (Alternatif)

```bash
# Domain ekle
vercel domains add egitim.today

# Domain durumunu kontrol et
vercel domains ls

# Domain detaylarını gör
vercel domains inspect egitim.today
```

## Doğrulama

DNS kayıtlarını düzelttikten sonra:

```powershell
# DNS cache temizle
ipconfig /flushdns

# DNS kontrolü
nslookup egitim.today
nslookup www.egitim.today

# Vercel domain durumunu kontrol et
vercel domains ls
```

**Beklenen Sonuç:**
- `egitim.today` → Vercel IP'leri (76.76.21.142 veya 66.33.60.66)
- Vercel Dashboard → Domains → `egitim.today` → Status: "Valid"
