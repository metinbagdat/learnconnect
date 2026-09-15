import React, { useEffect } from "react";
import { useLocation } from "wouter";
import {
  SupabaseAuthProvider,
  useSupabaseAuth,
} from "@/contexts/SupabaseAuthContext";
import Landing from "@/pages/study-track/Landing";
import Login from "@/pages/study-track/Login";
import Register from "@/pages/study-track/Register";
import Settings from "@/pages/study-track/Settings";
import Dashboard from "@/components/study-track/Dashboard";
import StudyTrackShell from "@/components/study-track/StudyTrackShell";

function normalizePath(loc: string): string {
  const p = loc.replace(/\/$/, "") || "/";
  if (p === "/calisma-takip") return "/calisma-takip";
  return p;
}

function RedirectTo({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  return (
    <StudyTrackShell>
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
        Yönlendiriliyor…
      </div>
    </StudyTrackShell>
  );
}

function Routes() {
  const [location] = useLocation();
  const { user, loading, configured } = useSupabaseAuth();
  const path = normalizePath(location);

  if (!configured) {
    return (
      <StudyTrackShell>
        <div className="flex-1 flex flex-col justify-center px-6 text-center">
          <p className="text-slate-300 text-sm">
            Supabase yapılandırması eksik.{" "}
            <code className="text-emerald-400">VITE_SUPABASE_URL</code> ve{" "}
            <code className="text-emerald-400">VITE_SUPABASE_ANON_KEY</code>{" "}
            ekleyin (bkz. docs/SUPABASE_STUDY_TRACK.md).
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="mt-6 py-3 rounded-xl bg-slate-700 text-white text-sm"
          >
            Ana sayfaya dön
          </button>
        </div>
      </StudyTrackShell>
    );
  }

  if (path === "/calisma-takip" || path === "/calisma-takip/landing") {
    return <Landing />;
  }

  if (path === "/calisma-takip/giris") {
    if (loading) {
      return (
        <StudyTrackShell>
          <div className="flex-1 flex items-center justify-center text-slate-400">
            …
          </div>
        </StudyTrackShell>
      );
    }
    if (user) return <RedirectTo to="/calisma-takip/panel" />;
    return <Login />;
  }

  if (path === "/calisma-takip/kayit") {
    if (loading) {
      return (
        <StudyTrackShell>
          <div className="flex-1 flex items-center justify-center text-slate-400">
            …
          </div>
        </StudyTrackShell>
      );
    }
    if (user) return <RedirectTo to="/calisma-takip/panel" />;
    return <Register />;
  }

  if (path === "/calisma-takip/ayarlar") {
    if (loading) {
      return (
        <StudyTrackShell>
          <div className="flex-1 flex items-center justify-center text-slate-400">
            …
          </div>
        </StudyTrackShell>
      );
    }
    if (!user) return <RedirectTo to="/calisma-takip/giris" />;
    return <Settings />;
  }

  if (path === "/calisma-takip/panel") {
    if (loading) {
      return (
        <StudyTrackShell>
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Oturum kontrolü…
          </div>
        </StudyTrackShell>
      );
    }
    if (!user) return <RedirectTo to="/calisma-takip/giris" />;
    return <Dashboard />;
  }

  return (
    <StudyTrackShell>
      <div className="flex-1 flex items-center justify-center px-6 text-slate-400 text-sm">
        Sayfa bulunamadı.
      </div>
    </StudyTrackShell>
  );
}

export default function StudyTrackApp() {
  return (
    <SupabaseAuthProvider>
      <Routes />
    </SupabaseAuthProvider>
  );
}
