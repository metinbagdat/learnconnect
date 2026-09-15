import { getSupabase } from "@/lib/supabaseClient";
import type { StudyLogRow, StudyTrackStudent, TaskRow } from "@/types/study-track";

/** Tarayıcı yerel günü için [gün başı, gün sonu) ISO string (Edge ile aynı “bugün” filtresi) */
export function getLocalDayBoundsIso(): { dayStartIso: string; dayEndIso: string } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { dayStartIso: start.toISOString(), dayEndIso: end.toISOString() };
}

export async function ensureStudentRow(userId: string): Promise<StudyTrackStudent | null> {
  const sb = getSupabase();
  let { data: student } = await sb
    .from("students")
    .select("id, goal_net, daily_minutes, current_net, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (!student) {
    await sb.from("students").insert({
      id: userId,
      goal_net: 40,
      daily_minutes: 60,
      current_net: 0,
    });
    const again = await sb
      .from("students")
      .select("id, goal_net, daily_minutes, current_net, created_at")
      .eq("id", userId)
      .maybeSingle();
    student = again.data;
  }
  return student as StudyTrackStudent | null;
}

export async function fetchStudyLogs(
  userId: string,
  sinceDays = 60,
): Promise<StudyLogRow[]> {
  const sb = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);
  const { data, error } = await sb
    .from("study_logs")
    .select("id, student_id, topic_id, duration, net, created_at")
    .eq("student_id", userId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchStudyLogs", error);
    return [];
  }
  return (data ?? []) as StudyLogRow[];
}

export async function fetchTodayTasks(
  userId: string,
  dayStartIso: string,
  dayEndIso: string,
): Promise<TaskRow[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("tasks")
    .select("id, student_id, title, duration, type, completed, created_at")
    .eq("student_id", userId)
    .gte("created_at", dayStartIso)
    .lt("created_at", dayEndIso)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("fetchTodayTasks", error);
    return [];
  }
  return (data ?? []) as TaskRow[];
}

/** Son N gün içindeki net toplamı (çalışma kayıtlarından) — current_net ile birlikte kullanılabilir */
export async function sumNetFromLogs(
  userId: string,
  days: number,
): Promise<number> {
  const sb = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);
  const { data, error } = await sb
    .from("study_logs")
    .select("net")
    .eq("student_id", userId)
    .gte("created_at", since.toISOString());

  if (error || !data) return 0;
  return data.reduce((acc, row) => acc + (row.net ?? 0), 0);
}

export async function updateStudentCurrentNet(
  userId: string,
  currentNet: number,
): Promise<void> {
  const sb = getSupabase();
  await sb.from("students").update({ current_net: currentNet }).eq("id", userId);
}
