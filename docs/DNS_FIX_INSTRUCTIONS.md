# DNS Düzeltme Talimatları - egitim.today

## Domain Karisiklik Onleme Checklist

- Vercel fatura ve domain kaydindaki punycode degerini birebir kopyala (elle yazma).
- Projeye domain eklerken once `xn--eitim-k1a.today` gibi ASCII/punycode degerini kullan.
- Benzer gorunen ama farkli domainleri karistirma: `xn--eitim-k1a.today` != `xn--etim-kia.today`.
- Vercel Project -> Settings -> Domains ekraninda gorunen host ile DNS panelindeki host birebir ayni olmali.
- `www` hostunu ayri kayit olarak ekle ve durumunu ayri dogrula.
- Son adimda her iki host icin de durum `Valid/Active` olana kadar `Refresh` ile kontrol et.

## Mevcut Durum

- Vercel artık apex domain için yeni IP aralığı gösterebilir: `216.198.79.x`
- Eski Vercel kayıtları (`76.76.21.21` ve `cname.vercel-dns.com`) bazı projelerde halen çalışabilir
- Geçerli kayıt olarak her zaman Vercel Dashboard -> Domains ekranında gösterilen değer esas alınmalı

## Cozum DNS Kayitlarini Duzelt

### Adım 1 Domain Sağlayıcı DNS Paneline Git

- Namecheap, GoDaddy, veya hangi sağlayıcıdan aldıysan oraya git
- DNS Management / DNS Records / Zone Editor bölümüne gir

### Adım 2 Mevcut Yanlış Kayıtları Sil

- `egitim.today` için Vercel'in istemediği eski A kayıtları varsa → SİL
- `www.egitim.today` için Vercel'in istemediği eski A/CNAME kayıtları varsa → SİL
- Eski/yanlış tüm kayıtları temizle

### Adım 3 Doğru DNS Kayıtlarını Ekle

#### Seçenek A: A Kaydı Kullan (Apex Domain için)

```txt
Type: A
Name/Host: @ (veya egitim.today)
Value: 216.198.79.1
TTL: 3600 (veya Auto)
```

Not: Vercel bazı projelerde `216.198.79.1`, bazılarında farklı bir `216.198.79.x` değeri veya eski `76.76.21.21` değeri gösterebilir. Burada esas olan Vercel'in ilgili domain için istediği tam değerdir.

#### Seçenek B: CNAME Kullan (Önerilen - Vercel'in tercih ettiği)

```txt
Type: CNAME
Name/Host: @ (veya egitim.today)
Value: cname.vercel-dns.com
TTL: 3600 (veya Auto)
```

**NOT:** Bazı DNS sağlayıcıları apex domain (@) için CNAME'e izin vermez.
Eğer CNAME ekleyemezsen, Vercel'in Domains ekranında gösterdiği A kaydını kullan.

### Adım 4: www Alt Domaini Ekle

```txt
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

- `egitim.today` → Vercel'in gösterdiği A kaydı (`216.198.79.1` gibi) veya proje için kabul edilen eski değer
- `www.egitim.today` → genellikle `cname.vercel-dns.com` (Vercel ekranında farklı bir hedef yoksa)

### Adım 7: SSL Sertifikası Bekle

Vercel otomatik olarak SSL sertifikası oluşturur (5-15 dakika).
Vercel Dashboard → Domains → `egitim.today` → Status: "Valid" olmalı.

## Sorun Giderme

### DNS hala yanlış IP gösteriyorsa

1. DNS cache temizle: `ipconfig /flushdns` (Windows)
2. Farklı DNS server kullan: Google DNS (8.8.8.8) veya Cloudflare (1.1.1.1)
3. 15-30 dakika bekle (DNS propagation zaman alabilir)

### Vercel'de domain "Pending" durumundaysa

1. DNS kayıtlarının doğru olduğundan emin ol
2. Vercel Dashboard'da "Refresh" / "Recheck DNS" butonuna bas
3. Birkaç dakika bekle

## Önemli Notlar

- **Sadece bir yöntem kullan:** Ya A kaydı, ya CNAME (ikisini birlikte kullanma)
- **TTL değeri:** 3600 (1 saat) veya Auto önerilir
- **Propagation süresi:** 5 dakika - 48 saat arası değişebilir (genellikle 15-30 dakika)
- **Yeni Vercel IP aralıklarını yanlış sanma:** `216.198.79.x` artık Vercel tarafından istenen geçerli kayıt olabilir
