import React from "react";
import { Link } from "wouter";
import StudyTrackShell from "@/components/study-track/StudyTrackShell";

export default function StudyTrackLanding() {
  return (
    <StudyTrackShell>
      <div className="flex-1 flex flex-col justify-between px-6 py-10">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400/90 mb-2">
            LearnConnect
          </p>
          <h1 className="text-3xl font-bold text-white leading-tight">
            Çalışma takip
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Hedef net, günlük görevler ve haftalık rapor — tek ekranda.
          </p>
        </div>
        <div className="space-y-3">
          <Link
            href="/calisma-takip/kayit"
            className="block w-full text-center py-3.5 rounded-2xl font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
          >
            Ücretsiz başla
          </Link>
          <Link
            href="/calisma-takip/giris"
            className="block w-full text-center py-3.5 rounded-2xl font-medium border border-slate-600 text-slate-200 hover:bg-slate-800/80 transition"
          >
            Giriş yap
          </Link>
        </div>
      </div>
    </StudyTrackShell>
  );
}
