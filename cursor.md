# Cursor / agent notları (LearnConnect)

## Yerel çalıştırma

- **Bu projede uygulamayı yerelde çalıştırmayı hedeflemeyin** (`npm run dev`, `vite`, vb.). Kullanıcı yerelde çalıştırmıyor ve çalıştırmak istemiyor.
- Değişiklikleri doğrulamak için **doğrudan deploy** (ör. Vercel / mevcut pipeline) ve **canlı ortamda** kontrol tercih edilir.
- Windows ortamında `npm` / `npx` sırasında **`ERR_SSL_CIPHER_OPERATION_FAILED`** gibi SSL hataları görülebilir; bu, yerel kurulumu zorunlu kılmaz — CI veya deploy üzerinden build doğrulanır.

## Asistan davranışı

- Kullanıcıya “yerelde şunu çalıştır” diye talimat vermek yerine: kod değişikliği, PR/deploy notu ve canlıda kontrol listesi verin.
- Build/test gerekiyorsa **GitHub Actions** veya kullanıcının belirttiği uzak ortamı varsayın.
