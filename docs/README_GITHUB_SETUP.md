# ⚡ HIZLI KURULUM - GitHub Actions için Neon Credentials

## 🎯 Tek Satır Özet

GitHub'a 2 şey eklemeniz gerekiyor:
1. **Secret:** `NEON_API_KEY` = Neon Console'dan alın
2. **Variable:** `NEON_PROJECT_ID` = `quiet-tooth-34242456` ✅ (Hazır!)

## 📍 Doğrudan Linkler

- **GitHub Secrets Ekleyin:** https://github.com/metinbagdat/learnconnect-/settings/secrets/actions
- **Neon API Key Alın:** https://console.neon.tech/app/settings/api-keys

## ⚙️ 2 Dakikada Kurulum

### 1️⃣ Neon API Key (30 saniye)
```
1. https://console.neon.tech/app/settings/api-keys → "Create API Key"
2. İsim: "GitHub Actions"
3. Key'i kopyala (neon_ ile başlar)
```

### 2️⃣ GitHub'a Ekle (1.5 dakika)
```
1. https://github.com/metinbagdat/learnconnect-/settings/secrets/actions
2. "New repository secret" → NEON_API_KEY → yapıştır
3. "Variables" sekmesi → "New repository variable" → NEON_PROJECT_ID → quiet-tooth-34242456
```

### 3️⃣ Test Et (30 saniye)
```
1. PR'ı yeniden aç veya yeni commit push et
2. GitHub Actions sekmesinde workflow'un başarılı olduğunu kontrol et
```

## ✅ Kontrol Listesi

- [ ] Neon API Key oluşturuldu
- [ ] NEON_API_KEY secret olarak eklendi  
- [ ] NEON_PROJECT_ID = `quiet-tooth-34242456` variable olarak eklendi
- [ ] Workflow başarıyla çalıştı

## 🆘 Sorun mu var?

Detaylı rehber için: `add-neon-to-github.md` dosyasına bakın.

