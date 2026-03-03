# DNS Düzeltme Talimatları - egitim.today

## Mevcut Durum
- `egitim.today` yanlış IP'lere yönleniyor (216.198.79.x)
- `www.egitim.today` yanlış IP'lere yönleniyor (64.29.17.x)
- Vercel IP'leri: 76.76.21.142, 66.33.60.66

## Çözüm: DNS Kayıtlarını Düzelt

### Adım 1: Domain Sağlayıcı DNS Paneline Git
- Namecheap, GoDaddy, veya hangi sağlayıcıdan aldıysan oraya git
- DNS Management / DNS Records / Zone Editor bölümüne gir

### Adım 2: Mevcut Yanlış Kayıtları Sil
- `egitim.today` için A kayıtları (216.198.79.x) → SİL
- `www.egitim.today` için A/CNAME kayıtları (64.29.17.x) → SİL
- Eski/yanlış tüm kayıtları temizle

### Adım 3: Doğru DNS Kayıtlarını Ekle

#### Seçenek A: A Kaydı Kullan (Apex Domain için)
```
Type: A
Name/Host: @ (veya egitim.today)
Value: 76.76.21.142
TTL: 3600 (veya Auto)
```

#### Seçenek B: CNAME Kullan (Önerilen - Vercel'in tercih ettiği)
```
Type: CNAME
Name/Host: @ (veya egitim.today)
Value: cname.vercel-dns.com
TTL: 3600 (veya Auto)
```

**NOT:** Bazı DNS sağlayıcıları apex domain (@) için CNAME'e izin vermez. 
Eğer CNAME ekleyemezsen, A kaydı kullan (76.76.21.142).

### Adım 4: www Alt Domaini Ekle
```
Type: CNAME
Name/Host: www
Value: cname.vercel-dns.com
TTL: 3600 (veya Auto)
```

### Adım 5: Vercel Dashboard'da Domain Ekle
1. Vercel Dashboard → Projen → Settings → Domains
2. "Add Domain" butonuna tıkla
3. `egitim.today` yaz ve ekle
4. `www.egitim.today` ekle (opsiyonel, redirect olarak ayarla)

### Adım 6: Doğrulama
DNS değişiklikleri 5-15 dakika içinde yayılır. Kontrol et:

```powershell
nslookup egitim.today
nslookup www.egitim.today
```

**Beklenen Sonuç:**
- `egitim.today` → 76.76.21.142 veya 66.33.60.66 (Vercel IP'leri)
- `www.egitim.today` → cname.vercel-dns.com (CNAME kaydı)

### Adım 7: SSL Sertifikası Bekle
Vercel otomatik olarak SSL sertifikası oluşturur (5-15 dakika).
Vercel Dashboard → Domains → `egitim.today` → Status: "Valid" olmalı.

## Sorun Giderme

### DNS hala yanlış IP gösteriyorsa:
1. DNS cache temizle: `ipconfig /flushdns` (Windows)
2. Farklı DNS server kullan: Google DNS (8.8.8.8) veya Cloudflare (1.1.1.1)
3. 15-30 dakika bekle (DNS propagation zaman alabilir)

### Vercel'de domain "Pending" durumundaysa:
1. DNS kayıtlarının doğru olduğundan emin ol
2. Vercel Dashboard'da "Refresh" / "Recheck DNS" butonuna bas
3. Birkaç dakika bekle

## Önemli Notlar
- **Sadece bir yöntem kullan:** Ya A kaydı, ya CNAME (ikisini birlikte kullanma)
- **TTL değeri:** 3600 (1 saat) veya Auto önerilir
- **Propagation süresi:** 5 dakika - 48 saat arası değişebilir (genellikle 15-30 dakika)
