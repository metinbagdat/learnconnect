import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { extractJsonObject } from "../_shared/parse_ai_json.ts";

type TaskRow = {
  title: string;
  duration: number;
  type: string;
};

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let body: { dayStartIso?: string; dayEndIso?: string } = {};
  if (req.method === "POST") {
    try {
      body = await req.json();
    } catch {
      /* boş gövde veya geçersiz JSON */
    }
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Missing or invalid Authorization" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const uid = user.id;

    const { data: student, error: rowErr } = await supabase
      .from("students")
      .select("goal_net, daily_minutes, current_net")
      .eq("id", uid)
      .maybeSingle();

    if (rowErr) {
      return jsonResponse({ error: rowErr.message }, 400);
    }

    const goal = student?.goal_net ?? 40;
    const dailyMinutes = student?.daily_minutes ?? 60;
    const currentNet = student?.current_net ?? 0;

    const now = new Date();
    const utcMidnight = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const dayStart =
      body.dayStartIso ?? utcMidnight.toISOString();
    const dayEnd =
      body.dayEndIso ??
      new Date(utcMidnight.getTime() + 86400000).toISOString();

    const { data: todaysTasks } = await supabase
      .from("tasks")
      .select("id")
      .eq("student_id", uid)
      .gte("created_at", dayStart)
      .lt("created_at", dayEnd);

    if (todaysTasks && todaysTasks.length >= 3) {
      return jsonResponse({
        ok: true,
        skipped: true,
        message: "Bugün için görevler zaten oluşturulmuş.",
        count: todaysTasks.length,
      });
    }

    const { data: logs } = await supabase
      .from("study_logs")
      .select("topic_id, duration, net, created_at")
      .eq("student_id", uid)
      .order("created_at", { ascending: false })
      .limit(20);

    const { data: recentTasks } = await supabase
      .from("tasks")
      .select("title, type, completed, created_at")
      .eq("student_id", uid)
      .order("created_at", { ascending: false })
      .limit(15);

    const lastSummary = summarizeStudyLogs(logs ?? []);
    const taskSummary = (recentTasks ?? [])
      .map((t) => `${t.title} (${t.type})${t.completed ? " ✓" : ""}`)
      .join("; ");

    const prompt =
      `Kullanıcı hedef net: ${goal}, şu an net: ${currentNet}, günlük hedef süre: ${dailyMinutes} dk. ` +
      `Son çalışma özeti: ${lastSummary}. ` +
      `Son görevler: ${taskSummary || "yok"}. ` +
      `Bugün için tam 3 görev öner (konu, süre, tür). ` +
      `Yanıtı SADECE geçerli JSON olarak döndür, başka metin yok. Format:\n` +
      `{"tasks":[{"title":"string","duration":number,"type":"string"},...]}`;

    const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: "DEEPSEEK_API_KEY not configured" }, 500);
    }

    const aiRes = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "Sen bir TYT/AYT çalışma koçusun. Görevleri kısa ve uygulanabilir yaz.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      return jsonResponse(
        { error: "DeepSeek API failed", detail: t },
        502,
      );
    }

    const aiJson = await aiRes.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { tasks?: TaskRow[] };
    try {
      const jsonStr = extractJsonObject(
        typeof raw === "string" ? raw : JSON.stringify(raw),
      );
      parsed = JSON.parse(jsonStr);
    } catch {
      return jsonResponse({ error: "AI yanıtı JSON değil", raw }, 502);
    }

    const tasks = (parsed.tasks ?? []).slice(0, 3);
    if (tasks.length === 0) {
      return jsonResponse({ error: "AI görev üretemedi", raw }, 502);
    }

    const rows = tasks.map((t) => ({
      student_id: uid,
      title: String(t.title).slice(0, 500),
      duration: Math.max(5, Math.min(480, Number(t.duration) || 30)),
      type: String(t.type || "study").slice(0, 64),
      completed: false,
    }));

    const { data: inserted, error: insErr } = await supabase
      .from("tasks")
      .insert(rows)
      .select();

    if (insErr) {
      return jsonResponse({ error: insErr.message }, 400);
    }

    return jsonResponse({
      ok: true,
      tasks: inserted,
      model: "deepseek-chat",
    });
  } catch (e) {
    console.error(e);
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Unknown error" },
      500,
    );
  }
});

function summarizeStudyLogs(
  logs: { topic_id: string; duration?: number | null; created_at?: string }[],
): string {
  if (!logs.length) return "Henüz kayıt yok.";
  const byTopic = new Map<string, Date>();
  for (const l of logs) {
    const d = new Date(l.created_at ?? 0);
    const prev = byTopic.get(l.topic_id);
    if (!prev || d > prev) byTopic.set(l.topic_id, d);
  }
  const lines: string[] = [];
  const now = Date.now();
  for (const [topic, d] of byTopic) {
    const days = Math.floor((now - d.getTime()) / 86400000);
    lines.push(`${topic}: son ${days} gün önce`);
  }
  return lines.slice(0, 6).join(", ");
}
