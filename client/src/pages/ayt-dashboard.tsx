import { Link } from 'wouter';
import { BookOpen, TreePine, ArrowRight } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import MainNavbar from '@/components/layout/MainNavbar';

export default function AytDashboard() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <MainNavbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">AYT Dashboard</h1>
          <p className="text-gray-600 mb-8">
            AYT müfredatı, konu ağacı ve çalışma planları Admin Panel üzerinden üretilip Firestore'a kaydedilir.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/admin"
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition"
            >
              <div className="p-2 bg-amber-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-800">AYT Müfredat Üret</h2>
                <p className="text-sm text-gray-500">Admin panelde AI ile AYT dersleri oluştur</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </Link>

            <Link
              href="/admin"
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition"
            >
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TreePine className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-800">Konu Ağacı ve Çalışma Planı</h2>
                <p className="text-sm text-gray-500">Alt konular, kazanımlar, günlük plan</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </Link>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <h3 className="font-medium text-blue-900 mb-2">Firestore yapısı</h3>
            <p className="text-sm text-blue-800">
              curriculum_ayt, topics, learningTree; çalışma planları study_plans altında.
            </p>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
