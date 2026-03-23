# Çalışma takip — kalan adımlar (checklist)

Yerelde `npm` / SSL sorunu varsa bu listeyi **GitHub Codespaces** veya başka bir ortamda tamamlayın.

## 1. `package-lock.json` senkronu (önerilen)

Kök dizinde:

```bash
npm install
npm run build
```

Başarılıysa `package-lock.json` değişikliklerini commit + push edin. Sonrasında [vercel.json](../vercel.json) içinde `installCommand` tekrar `npm ci` yapılabilir (daha deterministik build).

## 2. Branch’i `main` ile birleştirme

Çalışma takip değişiklikleri `study-track-75f08` (veya ilgili branch) üzerindeyse:

1. GitHub’da **Pull Request** açın: `study-track-75f08` → `main`
2. CI yeşil olduktan sonra **Merge**
3. Vercel production branch **`main`** ise otomatik deploy tetiklenir

## 3. Supabase

- [SUPABASE_STUDY_TRACK.md](./SUPABASE_STUDY_TRACK.md): migration, `DEEPSEEK_API_KEY`, `supabase functions deploy`
- Vercel’e `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` ekleyin (çalışma takip frontend için)

## 4. Uzak iş akışı (npm olmadan deploy)

[REMOTE_WORKFLOW_GITHUB_VERCEL.md](./REMOTE_WORKFLOW_GITHUB_VERCEL.md)

## 5. Silinen `docs/ENV_AND_GITHUB.md`

İçerik [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) ve [REMOTE_WORKFLOW_GITHUB_VERCEL.md](./REMOTE_WORKFLOW_GITHUB_VERCEL.md) ile değiştirildi; eski dosya gerekmez.
