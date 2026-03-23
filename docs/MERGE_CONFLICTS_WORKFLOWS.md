# GitHub workflow merge çakışması — nasıl çözülür?

**Adım adım PR çözümü:** [RESOLVE_PR_WORKFLOW_CONFLICTS.md](./RESOLVE_PR_WORKFLOW_CONFLICTS.md) · Script: [`scripts/resolve-workflow-merge-conflicts.ps1`](../scripts/resolve-workflow-merge-conflicts.ps1) / [`.sh`](../scripts/resolve-workflow-merge-conflicts.sh)

> **Durum:** `build-and-test.yml` ve `neon-branch-pr-with-migrations-improved.yml` bu repoda **kaldırıldı**. Uzak dalda hâlâ varsa merge’te **`git rm`** ile silin.

`main` ile feature dalını birleştirirken şu dosyalar çakışmış olabilir:

- `build-and-test.yml`
- `neon-branch-pr-with-migrations-improved.yml`
- `ci.yml`, `frontend-build.yml`, `neon-branch-pr-with-migrations.yml`, `vercel-deploy.yml`

## İlke

| Dosya | Çözüm |
|--------|--------|
| **`build-and-test.yml`** | **Silin** (deprecated; işi `ci.yml` + `frontend-build.yml` görüyor). |
| **`neon-branch-pr-with-migrations-improved.yml`** | **Silin** (bozuk/duplikattı). |
| **Diğer dört YAML** | Bu repodaki **güncel** içerik: Node 20, `checkout@v6`, `npm ci \|\| npm install`, Neon için `NEON_PROJECT_ID` koşulu. **Çakışma işaretlerini** kaldırıp bu dalın (düzeltilmiş) sürümünü bırakın. |

## Komut satırı (önerilen)

Repo kökünde, merge/rebase sırasında:

```bash
# 1) Bozuk workflow’ları tamamen kaldır (varsa)
git rm -f .github/workflows/build-and-test.yml 2>/dev/null || true
git rm -f .github/workflows/neon-branch-pr-with-migrations-improved.yml 2>/dev/null || true

# 2) Kalan çakışmalarda "bizim" dalınızı kullanmak için (merge: CURRENT branch = --ours)
#    NOT: Rebase’te --ours / --theirs tersine döner; emin değilseniz 3. adıma geçin.
# git checkout --ours .github/workflows/ci.yml
# git checkout --ours .github/workflows/frontend-build.yml
# ...

# 3) Elle: dosyalardaki <<<<<<< ======= >>>>>>> bloklarını silin,
#    içeriği bu repodaki son sürümle değiştirin, sonra:
git add .github/workflows/ci.yml \
        .github/workflows/frontend-build.yml \
        .github/workflows/neon-branch-pr-with-migrations.yml \
        .github/workflows/vercel-deploy.yml

git add -u .github/workflows/
git status
git commit   # veya merge’ü tamamlayın
```

## Referans

- [GITHUB_ACTIONS.md](./GITHUB_ACTIONS.md) — hangi workflow ne işe yarıyor.
