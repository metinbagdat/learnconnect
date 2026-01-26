# Git Branch Stratejisi ve Çalışma Akışı

## Branch İsimlendirme Politikası

### Ana Branch'ler
- **`main`**: Production-ready kod. Her zaman stabil ve deploy edilebilir olmalı.
- **`develop`**: Geliştirme branch'i. Feature'lar buraya merge edilir.

### Feature Branch'leri
Format: `feature/kısa-açıklama`

Örnekler:
- `feature/user-authentication`
- `feature/tyt-dashboard`
- `feature/certificate-verification`

### Bugfix Branch'leri
Format: `fix/kısa-açıklama`

Örnekler:
- `fix/login-error`
- `fix/database-connection`
- `fix/workflow-neon-branch-ci-422`

### Hotfix Branch'leri
Format: `hotfix/kısa-açıklama`

Production'da kritik bir bug bulunduğunda kullanılır.

### Test Branch'leri
Format: `test/kısa-açıklama`

Örnekler:
- `test/neon-workflow-test`
- `test/workflow-validation`

## Çalışma Akışı

### Yeni Feature Geliştirme

```bash
# 1. Ana branch'ten yeni feature branch'i oluştur
git checkout main
git pull origin main
git checkout -b feature/yeni-ozellik

# 2. Değişiklikleri yap ve commit'le
git add .
git commit -m "feat: yeni özellik açıklaması"

# 3. Branch'i push et
git push -u origin feature/yeni-ozellik

# 4. GitHub'da Pull Request oluştur
```

### Bug Düzeltme

```bash
# 1. Ana branch'ten bugfix branch'i oluştur
git checkout main
git pull origin main
git checkout -b fix/bug-aciklamasi

# 2. Düzeltmeyi yap ve commit'le
git add .
git commit -m "fix: bug açıklaması"

# 3. Branch'i push et ve PR oluştur
git push -u origin fix/bug-aciklamasi
```

### Commit Mesaj Formatı (Conventional Commits)

Format: `type(scope): açıklama`

**Type'lar:**
- `feat`: Yeni özellik
- `fix`: Bug düzeltmesi
- `docs`: Dokümantasyon değişikliği
- `style`: Kod formatı (linter, prettier)
- `refactor`: Kod refactoring
- `test`: Test ekleme/düzeltme
- `chore`: Build, config değişiklikleri

**Örnekler:**
```
feat(auth): add user login functionality
fix(dashboard): resolve loading state issue
docs(readme): update installation instructions
refactor(api): simplify error handling
test(utils): add unit tests for helpers
```

## Branch Temizleme

### Eski Branch'leri Silme

```bash
# Local branch'leri listele
git branch

# Merge edilmiş branch'leri sil
git branch -d feature/eski-ozellik

# Zorla sil (dikkatli kullanın)
git branch -D feature/eski-ozellik

# Remote branch'leri sil
git push origin --delete feature/eski-ozellik
```

### Tüm Remote Branch'leri Senkronize Et

```bash
# Remote'da silinmiş branch'lerin local referanslarını temizle
git fetch --prune
```

## Best Practices

1. **Her zaman main'den branch oluştur**: Güncel kodla başla
2. **Kısa ve açıklayıcı branch isimleri kullan**: `feature/add-login` ✅, `2026-01-26-iwf6` ❌
3. **Düzenli olarak main'i pull et**: Conflict'leri önle
4. **PR'ları küçük tut**: Tek bir özellik/bug fix
5. **Commit'leri anlamlı yap**: Conventional Commits formatını kullan
6. **Merge'den önce test et**: Local'de çalıştığından emin ol

## Branch Protection Kuralları (GitHub)

GitHub'da `main` branch için şu kuralları ayarlayın:

1. **Require pull request reviews**: En az 1 onay
2. **Require status checks to pass**: CI/CD başarılı olmalı
3. **Require branches to be up to date**: Güncel olmalı
4. **Do not allow force pushes**: Zorla push yasak
5. **Do not allow deletions**: Branch silme yasak
