# Admin Route Ekleme Rehberi

## Wouter ile Routing

Projenizde Wouter kullanıldığı için, admin route'unu eklemek için aşağıdaki yöntemlerden birini kullanabilirsiniz:

### Yöntem 1: Router Component ile (Önerilen)

Ana routing dosyanızda (örneğin `App.tsx` veya `main.tsx`):

```typescript
import { Router, Route } from 'wouter';
import AdminPage from '@/pages/admin-page';

function App() {
  return (
    <Router>
      <Route path="/" component={HomePage} />
      <Route path="/tyt" component={TYTDashboard} />
      <Route path="/admin" component={AdminPage} />
      {/* Diğer route'lar */}
    </Router>
  );
}
```

### Yöntem 2: useLocation Hook ile

Eğer location-based routing kullanıyorsanız:

```typescript
import { useLocation } from 'wouter';
import AdminPage from '@/pages/admin-page';

function App() {
  const [location] = useLocation();
  
  if (location === '/admin') {
    return <AdminPage />;
  }
  
  // Diğer route'lar için switch/case veya if-else
  return (
    // ... diğer component'ler
  );
}
```

### Yöntem 3: ModernNavigation'a Link Ekleme

Eğer navigation component'inizde admin link'i eklemek istiyorsanız:

```typescript
import { Link } from 'wouter';
import { useAdminAuth } from '@/hooks/use-admin-auth';

function ModernNavigation() {
  const { isAdmin } = useAdminAuth();
  
  return (
    <nav>
      {/* Diğer link'ler */}
      {isAdmin && (
        <Link href="/admin">
          Admin Dashboard
        </Link>
      )}
    </nav>
  );
}
```

## Dosya Yapısı

Admin route için gerekli dosyalar hazır:

```
client/src/
├── pages/
│   └── admin-page.tsx          ✅ Hazır (AdminDashboard'u render ediyor)
└── components/admin/
    ├── AdminDashboard.tsx      ✅ Hazır
    ├── AdminLogin.tsx          ✅ Hazır
    └── AdminPanel.tsx          ✅ Hazır
```

## Test

Route'u ekledikten sonra:

1. Tarayıcıda `http://localhost:5173/admin` adresine gidin
2. Admin login sayfası görünmeli
3. Admin credentials ile giriş yapın
4. Admin panel görünmeli

## Notlar

- `admin-page.tsx` zaten oluşturuldu ve `AdminDashboard` component'ini import ediyor
- Admin authentication otomatik olarak `AdminDashboard` içinde kontrol ediliyor
- Eğer admin değilseniz, login sayfası gösterilir
- Eğer admin iseniz, `AdminPanel` gösterilir
