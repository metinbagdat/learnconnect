import { Link } from 'wouter';
import { BookOpen, Target, ArrowRight } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import MainNavbar from '@/components/layout/MainNavbar';

export default function YksDashboard() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
        <MainNavbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">YKS Dashboard</h1>
          <p className="text-gray-600 mb-8">
            YKS = TYT + AYT. Önce TYT temelini at, ardından AYT alan derslerine geç.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/tyt-dashboard"
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-800">TYT</h2>
                <p className="text-sm text-gray-500">Temel Yeterlilik Testi – müfredat, plan, denemeler</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </Link>

            <Link
              href="/ayt-dashboard"
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition"
            >
              <div className="p-2 bg-amber-100 rounded-lg">
                <Target className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-800">AYT</h2>
                <p className="text-sm text-gray-500">Alan Yeterlilik Testi – müfredat, konu ağacı, plan</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </Link>
          </div>

          <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <h3 className="font-medium text-indigo-900 mb-2">İlerleme takibi</h3>
            <p className="text-sm text-indigo-800">
              Haftalık plana otomatik dağıtım ve ilerleme takibi sonraki aşamada eklenecek.
            </p>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
