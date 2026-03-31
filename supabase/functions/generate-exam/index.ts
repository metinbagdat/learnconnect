import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

async function openaiJson(prompt: string, model: string): Promise<unknown> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) return null;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Return valid JSON only. No markdown fences." },
        { role: "user", content: prompt },
      ],
      temperature: 0.35,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI ${res.status}: ${t}`);
  }
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content?.trim() || "[]";
  const cleaned = String(text).replace(/^```json\s*/i, "").replace(/```\s*$/i, "");
  return JSON.parse(cleaned);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const ksdtTableId = body.ksdt_table_id as string;
    const title = body.title as string | undefined;
    if (!ksdtTableId) {
      return jsonResponse({ error: "ksdt_table_id required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: rows, error: rowErr } = await supabase.from("ksdt_rows").select("*").eq("ksdt_table_id", ksdtTableId);
    if (rowErr) throw rowErr;
    if (!rows?.length) {
      return jsonResponse({ error: "No KSDT rows" }, 400);
    }

    const loIds = [...new Set(rows.map((r: { learning_objective_id: string | null }) => r.learning_objective_id).filter(Boolean))] as string[];
    let loMap: Record<string, Record<string, unknown>> = {};
    if (loIds.length) {
      const { data: los, error: loErr } = await supabase.from("curriculum_tree").select("*").in("id", loIds);
      if (loErr) throw loErr;
      loMap = Object.fromEntries((los || []).map((c: { id: string }) => [c.id, c as Record<string, unknown>]));
    }

    const model = Deno.env.get("OPENAI_EXAM_MODEL") || "gpt-4o-mini";
    const examId = crypto.randomUUID();
    const examTitle = title || `AI exam ${new Date().toISOString().slice(0, 16)}`;

    await supabase.from("exams").insert({
      id: examId,
      title: examTitle,
      ksdt_table_id: ksdtTableId,
      status: "draft",
      config: { source: "edge_generate_exam" },
    });

    const questions: Record<string, unknown>[] = [];

    for (const row of rows as Array<Record<string, unknown>>) {
      const lo = row.learning_objective_id ? loMap[row.learning_objective_id as string] : null;
      const code = (lo?.code as string) || "N/A";
      const name = (lo?.name as string) || "Objective";
      const prompt = `Generate ${row.question_count} multiple-choice question(s) for Turkish MEB curriculum.\nCode: ${code}\nObjective: ${name}\nDifficulty: ${row.difficulty}\nReturn ONLY a JSON array: [{"question_text":"","options":["A)..","B)..","C)..","D).."],"correct_answer":"A","explanation":""}]`;

      let generated: Array<Record<string, unknown>> = [];
      try {
        const ai = await openaiJson(prompt, model);
        if (Array.isArray(ai)) {
          generated = ai as Array<Record<string, unknown>>;
        }
      } catch {
        generated = [];
      }
      if (!generated.length) {
        const n = Number(row.question_count) || 1;
        for (let i = 0; i < n; i++) {
          generated.push({
            question_text: `[Draft] ${code} Q${i + 1}`,
            options: ["A) A", "B) B", "C) C", "D) D"],
            correct_answer: "A",
            explanation: "Configure OPENAI_API_KEY for AI items.",
          });
        }
      }

      for (const q of generated) {
        questions.push({
          exam_id: examId,
          ksdt_row_id: row.id,
          learning_objective_code: code,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          ai_generated: Boolean(Deno.env.get("OPENAI_API_KEY")),
        });
      }

      await supabase.from("exam_generation_logs").insert({
        exam_id: examId,
        ksdt_table_id: ksdtTableId,
        prompt,
        model,
        response: { rowId: row.id, count: generated.length },
      });
    }

    if (questions.length) {
      const { error: insErr } = await supabase.from("exam_questions").insert(questions);
      if (insErr) throw insErr;
    }

    return jsonResponse({ examId, questionCount: questions.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: msg }, 500);
  }
});
