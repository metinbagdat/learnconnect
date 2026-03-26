import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib@1.17.1";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const { data: student } = await supabase
      .from("students")
      .select("goal_net, daily_minutes, current_net")
      .eq("id", uid)
      .maybeSingle();

    const { data: logs } = await supabase
      .from("study_logs")
      .select("topic_id, duration, net, created_at")
      .eq("student_id", uid)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true });

    const { data: tasks } = await supabase
      .from("tasks")
      .select("title, duration, type, completed, created_at")
      .eq("student_id", uid)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false });

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    let y = 800;
    const left = 50;
    const line = 16;

    const draw = (text: string, size = 11, bold = false) => {
      page.drawText(text, {
        x: left,
        y,
        size,
        font: bold ? fontBold : font,
        color: rgb(0.1, 0.1, 0.15),
        maxWidth: 495,
      });
      y -= line * (size / 11);
    };

    draw("LearnConnect — Haftalık Çalışma Raporu", 18, true);
    y -= 6;
    draw(`Oluşturulma: ${new Date().toLocaleString("tr-TR")}`, 10);
    draw(`Hedef net: ${student?.goal_net ?? "-"} | Şu an: ${student?.current_net ?? "-"}`, 11, true);
    y -= 8;

    draw("Son 7 gün — Çalışma kayıtları", 12, true);
    y -= 4;
    if (!logs?.length) {
      draw("Kayıt yok.");
    } else {
      for (const l of logs.slice(0, 40)) {
        const d = new Date(l.created_at ?? "").toLocaleDateString("tr-TR");
        draw(
          `${d} | ${l.topic_id} | ${l.duration} dk | net: ${l.net ?? "-"}`,
          10,
        );
        if (y < 80) break;
      }
    }
    y -= 10;
    draw("Son 7 gün — Görevler", 12, true);
    y -= 4;
    if (!tasks?.length) {
      draw("Görev yok.");
    } else {
      for (const t of tasks.slice(0, 30)) {
        const d = new Date(t.created_at ?? "").toLocaleDateString("tr-TR");
        draw(
          `${d} | ${t.title} | ${t.duration} dk | ${t.type} | ${t.completed ? "tamam" : "bekliyor"}`,
          10,
        );
        if (y < 80) break;
      }
    }

    const bytes = await pdf.save();
    const path = `${uid}/report-${Date.now()}.pdf`;

    const { error: upErr } = await supabase.storage
      .from("reports")
      .upload(path, bytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (upErr) {
      return jsonResponse({ error: upErr.message }, 400);
    }

    const { data: signed, error: signErr } = await supabase.storage
      .from("reports")
      .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days

    if (signErr || !signed?.signedUrl) {
      return jsonResponse(
        { error: signErr?.message ?? "Signed URL failed" },
        500,
      );
    }

    return jsonResponse({
      ok: true,
      path,
      url: signed.signedUrl,
      expiresIn: 60 * 60 * 24 * 7,
    });
  } catch (e) {
    console.error(e);
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Unknown error" },
      500,
    );
  }
});
