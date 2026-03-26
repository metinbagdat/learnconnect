import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getSupabase } from "@/lib/supabaseClient";
import StudyTrackShell from "@/components/study-track/StudyTrackShell";
import { ArrowLeft } from "lucide-react";

export default function StudyTrackSettings() {
  const [, setLocation] = useLocation();
  const [goalNet, setGoalNet] = useState(40);
  const [currentNet, setCurrentNet] = useState(0);
  const [dailyMinutes, setDailyMinutes] = useState(60);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const sb = getSupabase();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        setLocation("/calisma-takip/giris");
        return;
      }
      const { data } = await sb
        .from("students")
        .select("goal_net, current_net, daily_minutes")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setGoalNet(data.goal_net ?? 40);
        setCurrentNet(data.current_net ?? 0);
        setDailyMinutes(data.daily_minutes ?? 60);
      }
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const sb = getSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return;
    const { error } = await sb
      .from("students")
      .update({
        goal_net: goalNet,
        current_net: currentNet,
        daily_minutes: dailyMinutes,
      })
      .eq("id", user.id);
    if (error) setMsg(error.message);
    else setMsg("Kaydedildi.");
  };

  return (
    <StudyTrackShell>
      <div className="px-4 py-4 border-b border-slate-800 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setLocation("/calisma-takip/panel")}
          className="p-2 rounded-xl hover:bg-slate-800 text-slate-300"
          aria-label="Geri"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-white">Ayarlar</h1>
      </div>
      <div className="flex-1 px-6 py-6">
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Hedef net</label>
            <input
              type="number"
              value={goalNet}
              onChange={(e) => setGoalNet(Number(e.target.value))}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Şu an net (manuel)</label>
            <input
              type="number"
              step="0.1"
              value={currentNet}
              onChange={(e) => setCurrentNet(Number(e.target.value))}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Günlük hedef (dk)</label>
            <input
              type="number"
              value={dailyMinutes}
              onChange={(e) => setDailyMinutes(Number(e.target.value))}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white"
            />
          </div>
          {msg && <p className="text-sm text-emerald-400">{msg}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            Kaydet
          </button>
        </form>
      </div>
    </StudyTrackShell>
  );
}
