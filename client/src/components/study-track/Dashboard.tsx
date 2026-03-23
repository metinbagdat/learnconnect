import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { getSupabase } from "@/lib/supabaseClient";
import { trackStudyEvent } from "@/lib/studyTrackAnalytics";
import {
  ensureStudentRow,
  fetchStudyLogs,
  fetchTodayTasks,
  getLocalDayBoundsIso,
  updateStudentCurrentNet,
} from "@/lib/studyTrackApi";
import {
  last7DailyNet,
  streakDaysFromLogs,
  topicsNotStudiedInDays,
} from "@/lib/studyTrackUtils";
import StudyTrackShell from "./StudyTrackShell";
import DashboardSkeleton from "./DashboardSkeleton";
import Header from "./Header";
import TodayPlanCard, { type PlanTask } from "./TodayPlanCard";
import ProgressBar from "./ProgressBar";
import WarningCard from "./WarningCard";
import NetChart from "./NetChart";
import TargetCard from "./TargetCard";
import ReportShareModal from "./ReportShareModal";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [goalNet, setGoalNet] = useState(40);
  const [currentNet, setCurrentNet] = useState(0);
  const [logs, setLogs] = useState<
    { topic_id: string; duration: number; net: number | null; created_at: string }[]
  >([]);
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sb = getSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return;

    const student = await ensureStudentRow(user.id);
    if (student) {
      setGoalNet(student.goal_net ?? 40);
      setCurrentNet(student.current_net ?? 0);
    }

    const logRows = await fetchStudyLogs(user.id, 60);
    setLogs(
      logRows.map((l) => ({
        topic_id: l.topic_id,
        duration: l.duration,
        net: l.net,
        created_at: l.created_at,
      })),
    );

    const { dayStartIso, dayEndIso } = getLocalDayBoundsIso();
    const taskRows = await fetchTodayTasks(user.id, dayStartIso, dayEndIso);

    setTasks(
      taskRows.map((t) => ({
        id: t.id,
        title: t.title,
        duration: t.duration,
        type: t.type,
        completed: t.completed,
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      await trackStudyEvent("app_opened", { path: "/calisma-takip/panel" });
      try {
        const sb = getSupabase();
        const { dayStartIso, dayEndIso } = getLocalDayBoundsIso();
        await sb.functions.invoke("generate-daily-tasks", {
          body: { dayStartIso, dayEndIso },
        });
      } catch (e) {
        console.warn("generate-daily-tasks", e);
      }
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const streak = useMemo(
    () => streakDaysFromLogs(logs.map((l) => l.created_at)),
    [logs],
  );

  const warningMessage = useMemo(() => {
    const gaps = topicsNotStudiedInDays(
      logs.map((l) => ({ topic_id: l.topic_id, created_at: l.created_at })),
      3,
    );
    if (!gaps.length) return null;
    const g = gaps[0];
    return `${g.topic} konusuna ${g.daysSince} gündür çalışmadın. Bugün mutlaka göz at!`;
  }, [logs]);

  const chartData = useMemo(() => last7DailyNet(logs), [logs]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent =
    tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  const onToggle = async (id: string, completed: boolean) => {
    const sb = getSupabase();
    await sb.from("tasks").update({ completed }).eq("id", id);
    if (completed) await trackStudyEvent("task_completed", { task_id: id });
    await load();
  };

  const onMarkAllComplete = async () => {
    const sb = getSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return;
    const { dayStartIso, dayEndIso } = getLocalDayBoundsIso();
    await sb
      .from("tasks")
      .update({ completed: true })
      .eq("student_id", user.id)
      .gte("created_at", dayStartIso)
      .lt("created_at", dayEndIso);
    await trackStudyEvent("task_completed", { bulk: true });
    await load();
  };

  const onShareReport = async () => {
    setReportOpen(true);
    setReportUrl(null);
    setReportError(null);
    setReportLoading(true);
    try {
      const sb = getSupabase();
      const { data, error } = await sb.functions.invoke("generate-report", {
        body: {},
      });
      if (error) throw error;
      const url = (data as { url?: string })?.url;
      if (!url) throw new Error("URL yok");
      setReportUrl(url);
      await trackStudyEvent("report_shared", { url });
    } catch (e) {
      setReportError(e instanceof Error ? e.message : "Rapor oluşturulamadı");
    } finally {
      setReportLoading(false);
    }
  };

  const addStudyLog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const topic = String(fd.get("topic") ?? "").trim();
    const duration = Number(fd.get("duration") ?? 0);
    const net = Number(fd.get("net") ?? 0);
    if (!topic || duration <= 0) return;
    const sb = getSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return;
    await sb.from("study_logs").insert({
      student_id: user.id,
      topic_id: topic,
      duration,
      net: Number.isFinite(net) ? net : null,
    });
    await trackStudyEvent("study_log_created", { topic, duration, net });
    e.currentTarget.reset();
    await load();
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <StudyTrackShell>
      <Header
        streakDays={streak}
        onSettingsClick={() => setLocation("/calisma-takip/ayarlar")}
      />
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4 pt-4">
        <ProgressBar percent={progressPercent} />
        <WarningCard message={warningMessage} />
        <TargetCard goalNet={goalNet} currentNet={currentNet} />
        <NetChart data={chartData} />
        <TodayPlanCard
          tasks={tasks}
          onToggle={onToggle}
          onMarkAllComplete={onMarkAllComplete}
        />

        <form
          onSubmit={addStudyLog}
          className="rounded-2xl bg-slate-800/40 border border-slate-700/80 p-4 space-y-3"
        >
          <h3 className="text-sm font-semibold text-slate-200">Çalışma ekle</h3>
          <input
            name="topic"
            placeholder="Konu (örn. Limit)"
            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            required
          />
          <div className="flex gap-2">
            <input
              name="duration"
              type="number"
              min={1}
              placeholder="Dk"
              className="w-1/2 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
              required
            />
            <input
              name="net"
              type="number"
              step="0.1"
              placeholder="Net"
              className="w-1/2 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-medium text-white"
          >
            Kaydet
          </button>
        </form>

        <button
          type="button"
          onClick={() => void onShareReport()}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-violet-600 hover:bg-violet-500 text-white"
        >
          Raporumu Paylaş
        </button>
      </div>

      <ReportShareModal
        open={reportOpen}
        url={reportUrl}
        loading={reportLoading}
        error={reportError}
        onClose={() => setReportOpen(false)}
      />
    </StudyTrackShell>
  );
}
