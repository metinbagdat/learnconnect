import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { getSupabase } from "@/lib/supabaseClient";
import StudyTrackShell from "@/components/study-track/StudyTrackShell";

export default function StudyTrackLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const sb = getSupabase();
      const { error: err } = await sb.auth.signInWithPassword({
        email,
        password,
      });
      if (err) throw err;
      setLocation("/calisma-takip/panel");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudyTrackShell>
      <div className="flex-1 px-6 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Giriş</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">E-posta</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Şifre</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white"
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white"
          >
            {loading ? "…" : "Giriş yap"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Hesabın yok mu?{" "}
          <Link
            href="/calisma-takip/kayit"
            className="text-emerald-400 hover:underline"
          >
            Kayıt ol
          </Link>
        </p>
      </div>
    </StudyTrackShell>
  );
}
