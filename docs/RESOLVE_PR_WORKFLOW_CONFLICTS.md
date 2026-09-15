# PR: “This branch has conflicts” — workflow dosyaları

GitHub’da PR açıkken **6 workflow dosyası** çakışıyorsa aşağıdaki sırayı izleyin.

## Hedef sonuç

| Dosya | Ne olmalı |
|--------|------------|
| `build-and-test.yml` | **Silinmiş** (repo takip etmez) |
| `neon-branch-pr-with-migrations-improved.yml` | **Silinmiş** |
| `ci.yml`, `frontend-build.yml`, `neon-branch-pr-with-migrations.yml`, `vercel-deploy.yml` | **Bu dalın güncel içeriği** (Node 20, `checkout@v6`, `npm ci \|\| npm install`, Neon için `NEON_PROJECT_ID` koşulu) |

## 1) Uzak değişiklikleri alın

```bash
git fetch origin
git merge origin/main
# veya: git rebase origin/main
```

Çakışma mesajı gelince **durmayın** — aşağıdaki adımlarla çözün.

## 2) Otomatik (önerilen)

Repo kökünde:

**Windows (PowerShell):**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/resolve-workflow-merge-conflicts.ps1
```

**Git Bash / macOS / Linux:**

```bash
bash scripts/resolve-workflow-merge-conflicts.sh
```

Script: iki eski workflow’u **`git rm`** ile kaldırır (varsa), dört YAML’ı **`git add`** eder.

## 3) Elle (script kullanmıyorsanız)

```bash
git rm -f .github/workflows/build-and-test.yml
git rm -f .github/workflows/neon-branch-pr-with-migrations-improved.yml

# YAML içinde <<<<<<< ======= >>>>>>> varsa silin; main dalındaki doğru sürümü
# bu repodaki dosyalarla değiştirin, sonra:

git add .github/workflows/ci.yml \
        .github/workflows/frontend-build.yml \
        .github/workflows/neon-branch-pr-with-migrations.yml \
        .github/workflows/vercel-deploy.yml
```

## 4) Merge’i bitirin

```bash
git status
git commit   # merge commit veya rebase --continue
git push
```

GitHub PR sayfası yeşile döner.

## Referans

- [MERGE_CONFLICTS_WORKFLOWS.md](./MERGE_CONFLICTS_WORKFLOWS.md)
- [GITHUB_ACTIONS.md](./GITHUB_ACTIONS.md)
