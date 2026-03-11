# PR Workflow Test - Adımlar

## ✅ Yapılan İşlemler

1. ✅ Test branch oluşturuldu: `test/neon-workflow-test`
2. ✅ Test commit push edildi

## 📋 Sonraki Adımlar

### 1. Pull Request Oluşturun

**GitHub'da:**
1. Repository'ye gidin: https://github.com/metinbagdat/learnconnect-
2. **"Pull requests"** sekmesine tıklayın
3. **"New pull request"** butonuna tıklayın
4. **Base:** `main` ← **Compare:** `test/neon-workflow-test`
5. **"Create pull request"** butonuna tıklayın
6. Title: "Test: Neon Workflow"
7. **"Create pull request"** ile PR'ı oluşturun

### 2. Workflow'u Kontrol Edin

**PR oluşturulduğunda workflow otomatik başlar:**

1. **Actions sekmesine gidin:**
   https://github.com/metinbagdat/learnconnect-/actions

2. **En üstteki workflow run'ı bulun:**
   - "Create Neon Branch & Run Migrations" job'unu açın

3. **Adımları kontrol edin:**
   - ✅ **Check Neon Credentials** - Credentials kontrolü
   - ✅ **Create Neon Branch** - Neon branch oluşturma
   - ✅ **Run Database Migrations** - Migration çalıştırma

### 3. NEON_PROJECT_ID Kontrolü

**ÖNEMLİ:** Eğer workflow hata verirse, Variables sekmesinde kontrol edin:

1. **GitHub Settings:**
   https://github.com/metinbagdat/learnconnect-/settings/secrets/actions

2. **Variables sekmesine tıklayın**

3. **`NEON_PROJECT_ID` variable'ının olduğunu kontrol edin:**
   - **Name:** `NEON_PROJECT_ID`
   - **Value:** `quiet-tooth-34242456`

4. **Eğer yoksa ekleyin:**
   - **"New repository variable"**
   - Name: `NEON_PROJECT_ID`
   - Value: `quiet-tooth-34242456`

## 🔍 Olası Hatalar ve Çözümleri

### "NEON_PROJECT_ID is not set"
→ Variables sekmesinde ekleyin

### "NEON_API_KEY is not set"
→ Secrets sekmesinde olduğunu doğrulayın (zaten var)

### "DATABASE_URL is empty"
→ Neon branch oluşturulamadı - credentials'ları kontrol edin

## ✅ Başarı Kriterleri

Workflow başarılı olduğunda:
- ✅ Tüm adımlar yeşil
- ✅ Neon Console'da yeni branch görünür
- ✅ PR'a schema diff comment'i eklenir

## 🔗 Hızlı Linkler

- **Create PR:** https://github.com/metinbagdat/learnconnect-/compare/main...test/neon-workflow-test
- **Actions:** https://github.com/metinbagdat/learnconnect-/actions
- **Variables:** https://github.com/metinbagdat/learnconnect-/settings/secrets/actions

