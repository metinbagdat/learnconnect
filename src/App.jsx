import React, { useState, useEffect, Suspense } from 'react'
import { useLocation } from 'wouter'
import Dashboard from './components/Dashboard.jsx'
import StudyPlan from './components/StudyPlan.jsx'
import ProgressChart from './components/ProgressChart.jsx'
import LoadingSpinner from './components/LoadingSpinner.jsx'

// Import pages (lazy load)
const AdminDashboard = React.lazy(() => 
  import('./components/admin/AdminDashboard.jsx').catch(() => ({ default: () => <div>Admin panel yükleniyor...</div> }))
);

const LoginPage = React.lazy(() => 
  import('./client/src/pages/login.tsx').catch(() => ({ default: () => <div>Login sayfası yükleniyor...</div> }))
);

const RegisterPage = React.lazy(() => 
  import('./client/src/pages/register.tsx').catch(() => ({ default: () => <div>Register sayfası yükleniyor...</div> }))
);

const TytDashboard = React.lazy(() => 
  import('./client/src/pages/tyt-dashboard.tsx').catch(() => ({ default: () => <div>TYT Dashboard yükleniyor...</div> }))
);

const AuthGuard = React.lazy(() => 
  import('./client/src/components/auth/AuthGuard.tsx').catch(() => ({ default: ({ children }) => <>{children}</> }))
);

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [location] = useLocation()
  
  // Routes that don't need authentication
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.includes(location)
  const isAdminRoute = location.startsWith('/admin')
  const isTytRoute = location.startsWith('/tyt-dashboard')

  useEffect(() => {
    if (!isPublicRoute && !isAdminRoute && !isTytRoute) {
      fetch('/api/user')
        .then(res => res.json())
        .then(data => {
          setUser(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [isPublicRoute, isAdminRoute, isTytRoute])

  // Public routes (Login/Register)
  if (isPublicRoute) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        {location === '/login' && <LoginPage />}
        {location === '/register' && <RegisterPage />}
      </Suspense>
    )
  }

  // Admin Route
  if (isAdminRoute) {
    return (
      <Suspense fallback={<LoadingSpinner message="Admin Dashboard Yükleniyor..." />}>
        <AdminDashboard />
      </Suspense>
    )
  }

  // TYT Dashboard Route (Protected)
  if (isTytRoute) {
    return (
      <Suspense fallback={<LoadingSpinner message="TYT Dashboard Yükleniyor..." />}>
        <AuthGuard>
          <TytDashboard />
        </AuthGuard>
      </Suspense>
    )
  }

  // Student Dashboard (existing) - Protected
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, redirect to login
  if (!user && !isPublicRoute) {
    window.location.href = '/login'
    return null
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          {/* Header */}
          <header className="bg-white shadow-sm">
            <div className="container mx-auto px-4 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">LearnConnect</h1>
                  <p className="text-gray-600">TYT & AYT Akıllı Planlayıcı</p>
                </div>
                {user && (
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.profile?.grade}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await fetch('/api/logout', {
                            method: 'POST',
                            credentials: 'include'
                          })
                          window.location.href = '/login'
                        } catch (error) {
                          console.error('Logout failed:', error)
                          window.location.href = '/login'
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      Çıkış
                    </button>
                  </div>
                )}
                
                {/* Admin Link */}
                <a 
                  href="/admin" 
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  🔐 Admin Panel
                </a>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Dashboard */}
              <div className="lg:col-span-2">
                <Dashboard user={user} />
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                <StudyPlan />
                <ProgressChart />
              </div>
            </div>

            {/* API Status */}
            <div className="mt-12 p-4 bg-white rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">API Durumu</h3>
                  <p className="text-sm text-gray-600">Backend servisleri çalışıyor</p>
                </div>
                <div className="flex space-x-4">
                  <a href="/health" className="px-4 py-2 bg-green-100 text-green-700 rounded text-sm font-medium" target="_blank">
                    Health Check
                  </a>
                  <a href="https://github.com/metinbahdat/learnconnect" className="px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm font-medium" target="_blank">
                    GitHub Repo
                  </a>
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t mt-12">
            <div className="container mx-auto px-4 py-6">
              <p className="text-center text-gray-600">
                © 2024 LearnConnect. Tüm hakları saklıdır.
              </p>
            </div>
          </footer>
        </div>
      </AuthGuard>
    </Suspense>
  )
}
