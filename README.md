# LearnConnect - TYT & AYT Akıllı Planlayıcı

Modern, hızlı ve kişiselleştirilmiş üniversite hazırlık platformu.

## 🚀 Özellikler

- 📊 Akıllı çalışma planlayıcı
- 📈 Gerçek zamanlı ilerleme takibi
- 🎯 Kişiye özel hedef belirleme
- 📱 Tam duyarlı tasarım
- ⚡ Hızlı ve modern arayüz

## 🛠️ Teknoloji Stack

- React 18
- Vite
- Tailwind CSS
- Vercel Serverless Functions

## 🚀 Kurulum

```bash
npm install
npm run dev
```

## 🐳 Dev Container (local)

Codespaces gerektirmeden, Docker Desktop ve VS Code üzerinde geliştirme ortamını çalıştırabilirsiniz.

**Gereksinimler:**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- VS Code [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) eklentisi

**Adımlar:**

1. Repoyu klonlayın ve VS Code'da açın.
2. Komut paletini açın (`Ctrl+Shift+P` / `Cmd+Shift+P`) → **Dev Containers: Reopen in Container** seçeneğini tıklayın.
3. Konteyner oluşturulduktan sonra bağımlılıklar otomatik yüklenir (`npm install`).
4. Geliştirme sunucusunu başlatın:

```bash
npm run dev
```

Vite, `http://localhost:5173` adresinde çalışacaktır.

## 🌐 Deployment

1. GitHub'a push yapın  
2. Vercel'de repoyu bağlayın (Git entegrasyonu)  
3. Her push'ta build **Vercel sunucularında** çalışır; yerelde `npm` hatası olsa bile deploy üretilebilir.

- **Env var setup rehberi**: Firebase, DB, session secret nasıl alınır?  
  → [docs/DEPLOYMENT_ENV_VARS.md](docs/DEPLOYMENT_ENV_VARS.md)

- [Vercel / env adımları](docs/VERCEL_DEPLOY.md)  
- [GitHub → Vercel uzak akış (npm olmadan)](docs/REMOTE_WORKFLOW_GITHUB_VERCEL.md)  
- [Çalışma takip modülü (Supabase)](docs/SUPABASE_STUDY_TRACK.md)
- [Study track: kalan adımlar / lock / merge](docs/CONTINUE_STUDY_TRACK.md)

## 📁 Proje Yapısı

```
├── api/              # Vercel Serverless Functions
├── src/              # React uygulaması
├── public/           # Statik dosyalar
└── index.html        # Giriş noktası
```

## 📞 API Endpoints

- `GET /api/user` - Kullanıcı bilgileri
- `POST /api/errors/report` - Hata raporlama
- `GET /health` - Sistem sağlık kontrolü

## 📄 Lisans

MIT
