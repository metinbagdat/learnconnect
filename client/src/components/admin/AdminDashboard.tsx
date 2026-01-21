import { useEffect } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import AdminLogin from './AdminLogin';
import AdminPanel from './AdminPanel';

export default function AdminDashboard() {
  const { isAdmin, loading, user } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <AdminLogin />;
  }

  return <AdminPanel />;
}
