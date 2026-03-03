# GitHub Actions Workflow Test - Kontrol Listesi

## ✅ Tamamlanan Adımlar

- [x] `NEON_API_KEY` secret eklendi (10 dakika önce)

## ⚠️ Kontrol Edilmesi Gereken

- [ ] `NEON_PROJECT_ID` variable eklendi mi?
  - **GitHub'da:** Secrets sayfasında **"Variables"** sekmesine tıklayın
  - **Eklenmeli:** `NEON_PROJECT_ID` = `quiet-tooth-34242456`

## 🧪 Workflow Test Adımları

### 1. Variables Kontrolü

1. GitHub'da aynı sayfada (Secrets and variables → Actions)
2. **"Variables"** sekmesine tıklayın
3. `NEON_PROJECT_ID` variable'ının ekli olduğunu kontrol edin
4. Eğer yoksa: **"New repository variable"** → Name: `NEON_PROJECT_ID`, Value: `quiet-tooth-34242456`

### 2. Workflow'u Test Et

1. **Actions sekmesine gidin:**
   https://github.com/metinbagdat/learnconnect-/actions

2. **En üstteki workflow run'ı kontrol edin:**
   - Son push'tan sonra "Create Neon Branch & Run Migrations" job'u çalışmış olmalı
   - Eğer çalışmadıysa, yeni bir commit push edin veya bir PR oluşturun

3. **Job loglarını inceleyin:**
   - "Check Neon Credentials" adımı
   - "Create Neon Branch" adımı
   - "Run Database Migrations" adımı

### 3. Olası Hatalar ve Çözümleri

#### Hata: "NEON_PROJECT_ID is not set"
→ Variables sekmesinde `NEON_PROJECT_ID` variable'ı yok
→ **Çözüm:** Variables sekmesine gidip ekleyin

#### Hata: "NEON_API_KEY is not set"
→ Secret doğru eklenmemiş olabilir
→ **Çözüm:** Secrets sekmesinde `NEON_API_KEY`'in olduğunu doğrulayın

#### Hata: "DATABASE_URL is empty"
→ Branch oluşturma başarısız
→ **Çözüm:** API key ve Project ID'nin doğru olduğundan emin olun

## 🔗 Hızlı Linkler

- **Variables ekle:** https://github.com/metinbagdat/learnconnect-/settings/secrets/actions (Variables sekmesi)
- **Actions:** https://github.com/metinbagdat/learnconnect-/actions
- **Neon Project ID:** `quiet-tooth-34242456`

