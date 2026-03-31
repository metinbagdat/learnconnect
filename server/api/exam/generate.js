/**
 * POST /api/exam/generate
 * Body: { ksdtTableId: string, title?: string, useAi?: boolean }
 * Creates draft exam + questions from KSDT rows (OpenAI when configured, else placeholder).
 */
import { randomUUID } from 'node:crypto';
import OpenAI from 'openai';
import { getSupabaseAdmin } from '../lib/supabase-admin.js';

function buildPrompt(row, lo) {
  const code = lo?.code || 'N/A';
  const name = lo?.name || 'Objective';
  return `You are an exam item writer aligned with the Turkish national curriculum (MEB).
Learning objective code: ${code}
Objective: ${name}
Generate exactly ${row.question_count} multiple-choice question(s).
Difficulty: ${row.difficulty}
Question type: ${row.question_type}

Return ONLY a JSON array (no markdown) with this shape:
[
  {
    "question_text": "...",
    "options": ["A) ...","B) ...","C) ...","D) ..."],
    "correct_answer": "A",
    "explanation": "short rationale"
  }
]`;
}

function placeholderQuestions(row, lo) {
  const code = lo?.code || 'OBJ';
  const out = [];
  for (let i = 0; i < row.question_count; i += 1) {
    out.push({
      question_text: `[Draft] Practice question ${i + 1} for ${code}`,
      options: ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
      correct_answer: 'A',
      explanation: 'Replace with AI-generated content when OPENAI_API_KEY is set.',
    });
  }
  return out;
}

async function callOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_EXAM_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Output valid JSON only. No markdown fences.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4,
  });
  const text = completion.choices[0]?.message?.content?.trim() || '[]';
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
  return JSON.parse(cleaned);
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ksdtTableId, title, useAi = true } = req.body || {};
    if (!ksdtTableId) {
      return res.status(400).json({ error: 'ksdtTableId is required' });
    }

    const supabase = getSupabaseAdmin();

    const { data: rows, error: rowErr } = await supabase.from('ksdt_rows').select('*').eq('ksdt_table_id', ksdtTableId);
    if (rowErr) throw rowErr;
    if (!rows?.length) {
      return res.status(400).json({ error: 'No KSDT rows for this table' });
    }

    const loIds = [...new Set(rows.map((r) => r.learning_objective_id).filter(Boolean))];
    let loMap = {};
    if (loIds.length) {
      const { data: los, error: loErr } = await supabase.from('curriculum_tree').select('*').in('id', loIds);
      if (loErr) throw loErr;
      loMap = Object.fromEntries((los || []).map((c) => [c.id, c]));
    }

    const examId = randomUUID();
    const examTitle = title || `AI exam — ${new Date().toISOString().slice(0, 16)}`;

    const { error: examErr } = await supabase.from('exams').insert({
      id: examId,
      title: examTitle,
      ksdt_table_id: ksdtTableId,
      status: 'draft',
      config: { source: 'ksdt_generate', useAi },
    });
    if (examErr) throw examErr;

    const questions = [];
    for (const row of rows) {
      const lo = row.learning_objective_id ? loMap[row.learning_objective_id] : null;
      const prompt = buildPrompt(row, lo);
      let generated = [];
      if (useAi && process.env.OPENAI_API_KEY) {
        try {
          generated = await callOpenAI(prompt);
          if (!Array.isArray(generated)) generated = [];
        } catch (aiErr) {
          console.error('[exam/generate] AI parse error', aiErr);
          generated = placeholderQuestions(row, lo);
          await supabase.from('exam_generation_logs').insert({
            exam_id: examId,
            ksdt_table_id: ksdtTableId,
            prompt,
            error: String(aiErr?.message || aiErr),
          });
        }
      } else {
        generated = placeholderQuestions(row, lo);
      }

      if (generated.length === 0) {
        generated = placeholderQuestions(row, lo);
      }

      for (const q of generated) {
        questions.push({
          exam_id: examId,
          ksdt_row_id: row.id,
          learning_objective_code: lo?.code || null,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation || null,
          ai_generated: Boolean(useAi && process.env.OPENAI_API_KEY),
        });
      }

      await supabase.from('exam_generation_logs').insert({
        exam_id: examId,
        ksdt_table_id: ksdtTableId,
        prompt,
        model: process.env.OPENAI_EXAM_MODEL || 'gpt-4o-mini',
        response: { rowId: row.id, count: generated.length },
      });
    }

    const { error: qErr } = await supabase.from('exam_questions').insert(questions);
    if (qErr) throw qErr;

    return res.status(201).json({
      examId,
      questionCount: questions.length,
      message: 'Draft exam created. Review and publish from the admin exam panel.',
    });
  } catch (e) {
    console.error('[exam/generate]', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
