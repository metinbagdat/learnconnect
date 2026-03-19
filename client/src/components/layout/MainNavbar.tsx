import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Search, Menu, X, Home, BookOpen, GraduationCap, NotebookPen, Users, User, Award, Crown } from 'lucide-react';
import { useState } from 'react';
import GamificationBar from '@/components/gamification/GamificationBar';

export default function MainNavbar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Plan: egitim.today | Dashboard | Öğrenme Yolları | Kurslar | Defterim | Topluluk | [Ara] [Profil]
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/basarilar', label: 'Başarılar', icon: Award },
    { path: '/paths', label: 'Öğrenme Yolları', icon: BookOpen },
    { path: '/courses', label: 'Kurslar', icon: GraduationCap },
    { path: '/notebook', label: 'Defterim', icon: NotebookPen },
    { path: '/community', label: 'Topluluk', icon: Users },
    { path: '/abonelik', label: 'Abonelik', icon: Crown },
  ];

  // Add teacher link if user is teacher or admin
  const teacherNavItems = user?.role === 'teacher' || user?.role === 'admin'
    ? [{ path: '/teacher', label: 'Öğretmen Paneli', icon: GraduationCap }]
    : [];
  
  const allNavItems = [...navItems, ...teacherNavItems];
  
  // Add certificates link to user menu (optional)

  const isActive = (path: string) => location === path || location.startsWith(path + '/');

  return (
    <>
      <GamificationBar />
      {/* Desktop Navbar */}
      <nav className="hidden md:flex bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                egitim.today
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center space-x-1">
              {allNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right Side: Search + Profile */}
            <div className="flex items-center space-x-4">
              {/* Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Ara"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* User Menu */}
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">{user.displayName || user.username}</p>
                    <p className="text-xs text-gray-500">{user.profile?.grade || 'Öğrenci'}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold hover:ring-2 hover:ring-blue-300 transition-all"
                  >
                    {(user.displayName || user.username)?.charAt(0).toUpperCase()}
                  </Link>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Çıkış
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Giriş Yap
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className="md:hidden bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              egitim.today
            </Link>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-gray-600"
                aria-label="Ara"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600"
                aria-label="Menü"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="mt-4 pb-4 border-t pt-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                      isActive(item.path) ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              {user && (
                <div className="pt-4 border-t">
                  <div className="px-4 py-2 flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">{user.displayName || user.username}</p>
                      <p className="text-xs text-gray-500">{user.profile?.grade || 'Öğrenci'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="flex justify-around items-center h-16">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              isActive('/dashboard') ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs">Ana Sayfa</span>
          </Link>
          <Link
            href="/notebook"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              isActive('/notebook') ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <NotebookPen className="h-5 w-5 mb-1" />
            <span className="text-xs">Defter</span>
          </Link>
          <Link
            href="/paths"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              isActive('/paths') ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <BookOpen className="h-5 w-5 mb-1" />
            <span className="text-xs">Yollar</span>
          </Link>
          <Link
            href="/profile"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              isActive('/profile') ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs">Profil</span>
          </Link>
        </div>
      </div>

      {/* Search Modal - Placeholder for now */}
      {searchOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-2 border-b pb-2 mb-4">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Notlar, kurslar, yollar içinde ara..."
                className="flex-1 outline-none text-lg"
                autoFocus
              />
            </div>
            <p className="text-sm text-gray-500 text-center py-8">
              Global arama özelliği yakında eklenecek
            </p>
          </div>
        </div>
      )}

      {/* Spacer for mobile bottom nav */}
      <div className="md:hidden h-16" />
    </>
  );
}
