import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { BilingualText } from '@/components/ui/bilingual-text';
import { useLanguage } from '@/contexts/consolidated-language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured || !auth) return;
    setLoading(true);
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Success - AdminDashboard will handle redirect
    } catch (err: any) {
      setError(
        language === 'tr' 
          ? 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.'
          : 'Login failed. Please check your credentials.'
      );
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            <BilingualText 
              text="LearnConnect Admin Panel – LearnConnect Admin Panel"
            />
          </CardTitle>
          <CardDescription>
            <BilingualText 
              text="Yönetici girişi yapın – Sign in as administrator"
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isFirebaseConfigured ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200 text-sm">
              <p className="font-medium mb-2">
                <BilingualText text="Firebase yapılandırılmamış – Firebase not configured" />
              </p>
              <p>
                <BilingualText text="Admin paneli için .env.local dosyasına VITE_FIREBASE_* değişkenlerini ekleyin. – Add VITE_FIREBASE_* variables to .env.local for admin panel." />
              </p>
            </div>
          ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                <BilingualText text="Email – Email" />
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@learnconnect.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                <BilingualText text="Şifre – Password" />
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <BilingualText 
                  text="Giriş yapılıyor... – Signing in..."
                />
              ) : (
                <BilingualText 
                  text="Yönetici Girişi – Admin Login"
                />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
