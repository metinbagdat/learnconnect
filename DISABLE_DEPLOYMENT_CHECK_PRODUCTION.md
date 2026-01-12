# Deployment Check'i Production için Devre Dışı Bırakma

## Adım Adım Talimatlar

### Adım 1: Deployment Check'i Bulun

Build and Deployment Settings sayfasında:
- "Deployment Checks" bölümünde
- "Create Neon Branch & Run Migrations" check'ini bulun
- Sağ tarafta **"..."** (üç nokta) icon'una tıklayın

### Adım 2: Check Ayarlarını Açın

"..." menüsünden şu seçenekleri görebilirsiniz:
- **"Configure"** veya **"Manage"** - Bu seçeneğe tıklayın
- Veya doğrudan check'in üzerine tıklayın

### Adım 3: Production'ı Devre Dışı Bırakın

Check ayarları sayfasında:

1. **"Environments"** veya **"Deployment Environments"** bölümünü bulun
2. **"Production"** seçeneğini bulun
3. Production için check'i **devre dışı bırakın**:
   - Toggle switch'i **OFF** (kapalı) yapın
   - Veya checkbox'tan **Production** seçimini kaldırın
   - Veya dropdown'dan **"Preview Only"** seçin

4. **"Preview"** veya **"Pull Request"** için check'i **açık tutun** (isteğe bağlı):
   - Preview/PR için toggle switch'i **ON** (açık) bırakın

### Adım 4: Değişiklikleri Kaydedin

- **"Save"** veya **"Update"** butonuna tıklayın
- Değişiklikler kaydedilir

## Alternatif Yöntem: Check'i Tamamen Kaldırma

Eğer check'i tamamen kaldırmak isterseniz:

1. "..." menüsüne tıklayın
2. **"Delete"** veya **"Remove"** seçeneğini seçin
3. Onaylayın

**Not:** Bu durumda check hem Production hem de Preview için devre dışı kalır.

## Beklenen Sonuç

Değişikliklerden sonra:

- ✅ Production deployment'lar check olmadan tamamlanabilir
- ✅ Preview/PR deployment'lar hala check çalıştırabilir (eğer açık bıraktıysanız)
- ✅ Deployment'lar artık check'i beklemeyecek

## Notlar

- Check ayarları sayfası Vercel'in arayüzüne göre değişebilir
- Bazı durumlarda "Manage" butonu external link (GitHub) olabilir
- Eğer external link ise, GitHub Actions workflow'unda check'i disable etmeniz gerekebilir

## Troubleshooting

### "Manage" Butonu External Link (GitHub) Gösteriyorsa

Eğer "Manage" butonu GitHub'a yönlendiriyorsa:

1. GitHub repository'ye gidin
2. Settings → Actions → Workflows
3. İlgili workflow'u bulun
4. Workflow dosyasında production deployment'lar için check'i skip edin

### Check'i Göremiyorsanız

- Sayfayı yenileyin (F5)
- Farklı bir tarayıcı deneyin
- Vercel Dashboard'da farklı bir bölümden erişmeyi deneyin
