import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { student_id, exam_id } = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    let attempts: unknown[] = [];
    if (student_id) {
      const { data } = await supabase
        .from("exam_attempts")
        .select("*")
        .eq("student_id", student_id)
        .order("completed_at", { ascending: false })
        .limit(10);
      attempts = data || [];
    }

    return jsonResponse({
      generatedAt: new Date().toISOString(),
      student_id: student_id || null,
      exam_id: exam_id || null,
      attempts,
      note: "Extend with PDF export (e.g. pdfkit) and storage upload.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: msg }, 500);
  }
});
