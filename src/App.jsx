import React, { useState, useEffect, Suspense } from 'react'
import Dashboard from './components/Dashboard.jsx'
import StudyPlan from './components/StudyPlan.jsx'
import ProgressChart from './components/ProgressChart.jsx'

// Import admin dashboard (lazy load)
const AdminDashboard = React.lazy(() => 
  import('./components/admin/AdminDashboard.jsx').catch(() => ({ default: () => <div>Admin panel yükleniyor...</div> }))
);

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Simple routing based on pathname
  const isAdminRoute = window.location.pathname.startsWith('/admin')

  useEffect(() => {
    if (!isAdminRoute) {
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
  }, [isAdminRoute])

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

  // Student Dashboard (existing)
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

  return (
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
  )
}
