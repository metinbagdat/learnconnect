import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { BookOpen, NotebookPen, Award, LogOut } from 'lucide-react';
import MainNavbar from '@/components/layout/MainNavbar';
import AuthGuard from '@/components/auth/AuthGuard';

export default function Profile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <MainNavbar />

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Profil</h1>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {(user?.displayName || user?.username || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {user?.displayName || user?.username || 'Kullanıcı'}
                </h2>
                <p className="text-gray-500">{user?.profile?.grade || 'Öğrenci'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setLocation('/dashboard')}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">Dashboard</span>
              </button>
              <button
                onClick={() => setLocation('/notebook')}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <NotebookPen className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">Defterim</span>
              </button>
              <button
                onClick={() => setLocation('/certificates')}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-50 hover:bg-amber-50 rounded-lg transition-colors"
              >
                <Award className="h-5 w-5 text-amber-600" />
                <span className="font-medium text-gray-900">Sertifikalarım</span>
              </button>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium"
          >
            <LogOut className="h-5 w-5" />
            <span>Çıkış Yap</span>
          </button>
        </main>
      </div>
    </AuthGuard>
  );
}
