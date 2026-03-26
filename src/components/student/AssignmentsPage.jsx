import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AssignmentsPage() {
  const [user, setUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  async function loadUserAndAssignments() {
    setLoading(true);
    try {
      const uRes = await fetch('/api/user');
      const uData = await uRes.json();
      setUser(uData);

      if (!uData?.id || String(uData.id) === '0') {
        setAssignments([]);
        return;
      }

      const query = statusFilter === 'all' ? '' : `&status=${statusFilter}`;
      const aRes = await fetch(`${API_BASE}/api/user/assignments?userId=${uData.id}${query}`);
      const aData = await aRes.json();
      if (aData.success) setAssignments(aData.assignments || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUserAndAssignments();
  }, [statusFilter]);

  async function toggleCompleted(a) {
    const next = a.status === 'completed' ? 'pending' : 'completed';
    await fetch(`${API_BASE}/api/user/assignments`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignmentId: a.id, status: next }),
    });
    await loadUserAndAssignments();
  }

  const stats = useMemo(() => {
    const total = assignments.length;
    const completed = assignments.filter(a => a.status === 'completed').length;
    const pending = assignments.filter(a => a.status === 'pending').length;
    return { total, completed, pending };
  }, [assignments]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-cyan-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-6 mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Ogretmen Gorevlerim</h1>
          <p className="text-gray-600 mt-1">Atanan konulari takip et ve tamamla.</p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-slate-50"><div className="text-sm text-gray-500">Toplam</div><div className="text-2xl font-bold">{stats.total}</div></div>
            <div className="p-3 rounded-lg bg-emerald-50"><div className="text-sm text-emerald-700">Tamamlandi</div><div className="text-2xl font-bold text-emerald-700">{stats.completed}</div></div>
            <div className="p-3 rounded-lg bg-amber-50"><div className="text-sm text-amber-700">Bekleyen</div><div className="text-2xl font-bold text-amber-700">{stats.pending}</div></div>
          </div>
          <div className="mt-4 flex gap-2">
            {['all', 'pending', 'completed'].map(s => (
              <button
                key={s}
                className={`px-3 py-2 rounded-lg text-sm ${statusFilter === s ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? 'Tumu' : s === 'pending' ? 'Bekleyen' : 'Tamamlanan'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Yukleniyor...</div>
          ) : assignments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Atanmis gorev yok.</div>
          ) : (
            <div className="divide-y">
              {assignments.map(a => (
                <div key={a.id} className="p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-800">{a.topics?.subjects?.name || '-'} / {a.topics?.name || '-'}</div>
                    <div className="text-sm text-gray-500">{a.topics?.units?.name || '-'} • Zorluk: {a.topics?.difficulty_level ?? '-'}</div>
                    <div className="text-sm text-gray-500 mt-1">Teslim: {a.due_at ? new Date(a.due_at).toLocaleString('tr-TR') : 'Belirtilmedi'}</div>
                    {a.note && <div className="text-sm text-gray-600 mt-1">Not: {a.note}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${a.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : a.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {a.status}
                    </span>
                    {a.status !== 'cancelled' && (
                      <button
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${a.status === 'completed' ? 'bg-gray-100 text-gray-700' : 'bg-emerald-600 text-white'}`}
                        onClick={() => toggleCompleted(a)}
                      >
                        {a.status === 'completed' ? 'Geri Al' : 'Tamamlandi Isaretle'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
