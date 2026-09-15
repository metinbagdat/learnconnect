# Windows / Git Bash — `npm` ve terminal karışıklığı

## Git push

`git push origin study-track-75f08` **başarılı** olduysa ekstra bir şey yapmanız gerekmez. Satır sonundaki `rigin study-track-75f08` gibi metinler bazen terminal kaydırmasından **kesik prompt** olabilir; önemli olan `To https://github.com/...` ve branch güncellemesidir.

## `pm: command not found`

Komut **`npm`** (Node Package Manager). **`pm`** değil.

```bash
npm install
```

## `npm error ...` satırlarını komut gibi çalıştırmayın

`npm install` başarısız olunca ekranda şuna benzer **log** düşer:

```text
npm error code ERR_SSL_CIPHER_OPERATION_FAILED
npm error ...
```

Bunlar **çalıştırılacak komut değil**; sadece hata açıklamasıdır. Aşağıdakiler **yanlıştır**:

```bash
npm error code ERR_SSL_CIPHER_OPERATION_FAILED   # ❌
npm error errno ERR_SSL_CIPHER_OPERATION_FAILED    # ❌
```

Doğru olan: sadece gerektiğinde `npm install`, `npm run build` vb.

## `ERR_SSL_CIPHER_OPERATION_FAILED` (npm registry)

Bu makinede TLS/OpenSSL ile npmjs.org bağlantısı kırılıyor; **yerelde `npm install` çoğu zaman çalışmayacak**. Alternatifler:

| Yol | Açıklama |
|-----|-----------|
| **GitHub Codespaces** | Repoyu aç → Code → Codespaces → `npm install` / `npm run build` |
| **CI** | Push sonrası [frontend-build](../.github/workflows/frontend-build.yml) zaten build alır |
| **Supabase CLI** | [Supabase CLI releases](https://github.com/supabase/cli/releases) — ZIP, `npm` gerekmez |
| **VPN / antivirüs** | Geçici kapatıp tekrar deneyin |

Ayrıntı: [CONTINUE_STUDY_TRACK.md](./CONTINUE_STUDY_TRACK.md) bölüm 7C.

## `supabase: command not found`

CLI yüklü değil. `npm` olmadan: yukarıdaki **Supabase ZIP** veya [Supabase Edge Functions deploy](../.github/workflows/supabase-edge-functions-deploy.yml) (GitHub Actions).

Project ref örneği dokümantasyonda; `YOUR_REF` yerine Dashboard’daki **Reference ID** yazın.
