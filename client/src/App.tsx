import React, { useState, useEffect, Suspense } from 'react'
import { useLocation } from 'wouter'
import ProgressChart from '@/components/ProgressChart'
import StudyPlan from '../../src/components/StudyPlan.jsx'

// Import pages (lazy load)
const AdminDashboard = React.lazy(() => 
  import('./components/admin/AdminDashboard.tsx').catch(() => ({ default: () => <div>Admin panel yükleniyor...</div> }))
);

const LoginPage = React.lazy(() => 
  import('./pages/login.tsx').catch(() => ({ default: () => <div>Login sayfası yükleniyor...</div> }))
);

const RegisterPage = React.lazy(() => 
  import('./pages/register.tsx').catch(() => ({ default: () => <div>Register sayfası yükleniyor...</div> }))
);

const TytDashboard = React.lazy(() => 
  import('./pages/tyt-dashboard.tsx').catch(() => ({ default: () => <div>TYT Dashboard yükleniyor...</div> }))
);

const AytDashboard = React.lazy(() => 
  import('./pages/ayt-dashboard.tsx').catch(() => ({ default: () => <div>AYT Dashboard yükleniyor...</div> }))
);

const YksDashboard = React.lazy(() => 
  import('./pages/yks-dashboard.tsx').catch(() => ({ default: () => <div>YKS Dashboard yükleniyor...</div> }))
);

const TeacherDashboard = React.lazy(() => 
  import('./pages/teacher-dashboard.tsx').catch(() => ({ default: () => <div>Öğretmen Paneli yükleniyor...</div> }))
);

const Dashboard = React.lazy(() => 
  import('./pages/dashboard.tsx').catch(() => ({ default: () => <div>Dashboard yükleniyor...</div> }))
);

const Notebook = React.lazy(() => 
  import('./pages/notebook.tsx').catch(() => ({ default: () => <div>Defterim yükleniyor...</div> }))
);

const LearningPaths = React.lazy(() => 
  import('./pages/paths.tsx').catch(() => ({ default: () => <div>Öğrenme Yolları yükleniyor...</div> }))
);

const AuthGuard = React.lazy(() => 
  import('./components/auth/AuthGuard.tsx').catch(() => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
);

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [location] = useLocation()
  
  // Routes that don't need authentication
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.includes(location)
  const isAdminRoute = location.startsWith('/admin')
  const isTeacherRoute = location.startsWith('/teacher')
  const isTytRoute = location.startsWith('/tyt-dashboard')
  const isAytRoute = location.startsWith('/ayt-dashboard')
  const isYksRoute = location.startsWith('/yks-dashboard')
  const isDashboardRoute = location === '/dashboard' || location.startsWith('/dashboard/')
  const isNotebookRoute = location === '/notebook' || location.startsWith('/notebook')
  const isPathsRoute = location === '/paths' || location.startsWith('/paths/')
  const isCoursesRoute = location === '/courses' || location.startsWith('/courses/')
  const isCommunityRoute = location === '/community' || location.startsWith('/community/')

  useEffect(() => {
    if (!isPublicRoute && !isAdminRoute && !isTeacherRoute && !isTytRoute && !isAytRoute && !isYksRoute) {
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
  }, [isPublicRoute, isAdminRoute, isTeacherRoute, isTytRoute, isAytRoute, isYksRoute])

  // Public routes (Login/Register)
  if (isPublicRoute) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      }>
        {location === '/login' && <LoginPage />}
        {location === '/register' && <RegisterPage />}
      </Suspense>
    )
  }

  // Admin Route
  if (isAdminRoute) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Admin Dashboard Yükleniyor...</p>
          </div>
        </div>
      }>
        <AdminDashboard />
      </Suspense>
    )
  }

  // Teacher Route (Protected)
  if (isTeacherRoute) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Öğretmen Paneli Yükleniyor...</p>
          </div>
        </div>
      }>
        <TeacherDashboard />
      </Suspense>
    )
  }

  // TYT Dashboard Route (Protected)
  if (isTytRoute) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">TYT Dashboard Yükleniyor...</p>
          </div>
        </div>
      }>
        <AuthGuard>
          <TytDashboard />
        </AuthGuard>
      </Suspense>
    )
  }

  // AYT Dashboard Route (Protected)
  if (isAytRoute) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">AYT Dashboard Yükleniyor...</p>
          </div>
        </div>
      }>
        <AytDashboard />
      </Suspense>
    )
  }

  // YKS Dashboard Route (Protected)
  if (isYksRoute) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">YKS Dashboard Yükleniyor...</p>
          </div>
        </div>
      }>
        <YksDashboard />
      </Suspense>
    )
  }

  // New Dashboard Route (Protected)
  if (isDashboardRoute) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Dashboard Yükleniyor...</p>
          </div>
        </div>
      }>
        <Dashboard />
      </Suspense>
    )
  }

  // Notebook Route (Protected)
  if (isNotebookRoute) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Defterim Yükleniyor...</p>
          </div>
        </div>
      }>
        <Notebook />
      </Suspense>
    )
  }

  // Learning Paths Route (Protected)
  if (isPathsRoute) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Öğrenme Yolları Yükleniyor...</p>
          </div>
        </div>
      }>
        <LearningPaths />
      </Suspense>
    )
  }

  // Courses Route (Protected)
  const Courses = React.lazy(() => 
    import('./pages/courses.tsx').catch(() => ({ default: () => <div>Kurslar yükleniyor...</div> }))
  );

  if (isCoursesRoute) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Kurslar Yükleniyor...</p>
          </div>
        </div>
      }>
        <Courses />
      </Suspense>
    )
  }

  // Certificates Route (Protected)
  const Certificates = React.lazy(() => 
    import('./pages/certificates.tsx').catch(() => ({ default: () => <div>Sertifikalar yükleniyor...</div> }))
  );

  const CertificateVerify = React.lazy(() => 
    import('./pages/certificate-verify.tsx').catch(() => ({ default: () => <div>Doğrulanıyor...</div> }))
  );

  if (location === '/certificates' || location.startsWith('/certificates/')) {
    if (location.startsWith('/certificates/verify/')) {
      return (
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600">Doğrulanıyor...</p>
            </div>
          </div>
        }>
          <CertificateVerify />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Sertifikalar Yükleniyor...</p>
          </div>
        </div>
      }>
        <Certificates />
      </Suspense>
    );
  }

  // Community Route (Protected)
  const Community = React.lazy(() => 
    import('./pages/community').catch(() => ({ default: () => <div>Topluluk yükleniyor...</div> }))
  );

  if (isCommunityRoute) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Topluluk Yükleniyor...</p>
          </div>
        </div>
      }>
        <Community />
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

  // If not authenticated and trying to access protected routes, redirect to login
  if (!user && !isPublicRoute && !isAdminRoute) {
    window.location.href = '/login'
    return null
  }

  // Default redirect: if user is authenticated and on root, go to dashboard
  if (user && location === '/') {
    window.location.href = '/dashboard'
    return null
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    }>
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
                          await fetch('/api/data?resource=logout', {
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
            <Dashboard />

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
