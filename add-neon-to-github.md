# GitHub'a Neon Credentials Ekleme - Adım Adım Rehber

## ✅ Bulunan Neon Bilgileri

- **Neon Project ID:** `quiet-tooth-34242456` ✅
- **Neon Project Name:** `createdb learnconnect`
- **Neon Organization:** `metinbaghdat@gmail.com`

## 🔑 Adım 1: Neon API Key Alın

1. **Neon Console'a gidin:** https://console.neon.tech/
2. Sağ üstteki profil simgesine tıklayın
3. **Account Settings** → **Developer Settings** seçin
4. **"Create API Key"** butonuna tıklayın
5. İsim verin: `GitHub Actions`
6. API Key'i kopyalayın (başlar: `neon_` ile)

## 🔐 Adım 2: GitHub'a Secret Ekleyin (NEON_API_KEY)

1. **GitHub repository'ye gidin:** https://github.com/metinbagdat/learnconnect-
2. **Settings** → **Secrets and variables** → **Actions** tıklayın
3. **"New repository secret"** butonuna tıklayın
4. Şunları girin:
   - **Name:** `NEON_API_KEY`
   - **Secret:** Neon Console'dan kopyaladığınız API key
5. **"Add secret"** tıklayın

## 📝 Adım 3: GitHub'a Variable Ekleyin (NEON_PROJECT_ID)

1. Hala **Secrets and variables** → **Actions** sayfasında
2. **"Variables"** sekmesine tıklayın
3. **"New repository variable"** butonuna tıklayın
4. Şunları girin:
   - **Name:** `NEON_PROJECT_ID`
   - **Value:** `quiet-tooth-34242456` ✅ (yukarıda bulundu)
5. **"Add variable"** tıklayın

## ✅ Adım 4: Doğrulama

**Kontrol edin:**
- ✅ `NEON_API_KEY` - Secrets sekmesinde görünmeli
- ✅ `NEON_PROJECT_ID` - Variables sekmesinde görünmeli

## 🚀 Adım 5: Workflow'u Test Edin

1. Bir PR açın veya mevcut PR'ı yeniden açın
2. GitHub Actions sekmesine gidin
3. Workflow'un çalıştığını kontrol edin
4. "Check Neon Credentials" adımı ✅ olmalı
5. "Create Neon Branch" adımı başarılı olmalı
6. "Run Database Migrations" başarılı olmalı

## 🔗 Hızlı Linkler

- **GitHub Secrets/Variables:** https://github.com/metinbagdat/learnconnect-/settings/secrets/actions
- **Neon Console:** https://console.neon.tech/
- **Neon API Keys:** https://console.neon.tech/app/settings/api-keys

## 📋 Checklist

- [ ] Neon API Key alındı
- [ ] NEON_API_KEY GitHub'a secret olarak eklendi
- [ ] NEON_PROJECT_ID GitHub'a variable olarak eklendi
- [ ] Workflow test edildi ve başarılı

---

**Not:** Eğer API key'inizi unuttuysanız veya kaybettiyseniz, yeni bir tane oluşturup eski olanı silebilirsiniz.

