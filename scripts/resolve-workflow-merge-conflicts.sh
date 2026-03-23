#!/usr/bin/env bash
# PR merge çakışması: workflow dosyalarını bu repodaki hedef sürüme göre çöz.
# Kullanım (repo kökünde, merge/rebase sırasında):
#   bash scripts/resolve-workflow-merge-conflicts.sh
# Sonra: git status && git commit

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Repo: $ROOT"

for f in \
  ".github/workflows/build-and-test.yml" \
  ".github/workflows/neon-branch-pr-with-migrations-improved.yml"
do
  if [[ -f "$f" ]]; then
    git rm -f "$f"
    echo "Removed (legacy): $f"
  else
    echo "Skip (absent): $f"
  fi
done

for f in \
  ".github/workflows/ci.yml" \
  ".github/workflows/frontend-build.yml" \
  ".github/workflows/neon-branch-pr-with-migrations.yml" \
  ".github/workflows/vercel-deploy.yml"
do
  git add "$f"
  echo "Staged: $f"
done

echo ""
echo "Done. Next: git status"
echo "If merge in progress: git commit"
