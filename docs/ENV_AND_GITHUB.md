# `.env` ve GitHub — güvenli kullanım

## Repo’da ne yapıldı?

- Kök [`.gitignore`](../.gitignore) güncellendi: `.env` ve `.env.*` ignore edilir; şablon dosyalar **takip edilir**: `!.env.example`, `!**/.env.example`.
- Gerçek anahtarları **yalnızca** kendi bilgisayarınızda / Vercel’de tutun; GitHub’a push etmeyin.

## Yerel `.env` (CLI kullanmadan)

1. GitHub’da repoyu açın → **Code** → **Add file** kullanmayın `.env` için.
2. Bilgisayarınızda (veya GitHub **Codespaces** varsa orada) proje kökünde `.env` oluşturup `VITE_*` değerlerini yapıştırın; bu dosya **commit edilmez** (`.gitignore` sayesinde).
3. **Vercel** (veya başka host): Project → **Settings** → **Environment Variables** ile aynı isimleri ekleyin; build orada çalışır.

## `.env` yanlışlıkla GitHub’a yüklendiyse?

**Anahtarları hemen yenileyin** (Supabase anon key rotate, DeepSeek key iptal, vb.).

### Seçenek A — GitHub web arayüzü

1. Repo → `.env` dosyasına tıklayın.
2. **Çöp kutusu (Delete)** veya **Edit** → içeriği silip commit mesajı: `Remove leaked .env`.

### Seçenek B — Başka bir makinede `git` varsa

```bash
git rm --cached .env
git commit -m "chore: stop tracking .env"
git push
```

Sonra [GitHub](https://github.com) → **Security** sekmesinde secret uyarı varsa talimatları izleyin.

## Şablon

Kök `.env.example` dosyasını kopyalayın; değişkenleri doldurun ve dosyayı `.env` olarak kaydedin (`.env` commit edilmez).

```text
copy .env.example .env
```

(Windows PowerShell’de aynı amaç için dosyayı elle kopyalayabilirsiniz.)
