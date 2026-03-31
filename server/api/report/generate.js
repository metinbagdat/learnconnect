/**
 * POST /api/report/generate
 * Body: { studentId?: string, examId?: string, format?: 'json' | 'pdf' }
 * MVP: returns structured JSON for PDF pipeline; PDF binary can be added with pdfkit later.
 */
import { getSupabaseAdmin } from '../lib/supabase-admin.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { studentId, examId, format = 'json' } = req.body || {};
    const supabase = getSupabaseAdmin();

    let attempts = [];
    if (studentId) {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('*, exams(title, status)')
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      attempts = data || [];
    }

    let examMeta = null;
    if (examId) {
      const { data, error } = await supabase.from('exams').select('*').eq('id', examId).single();
      if (error) throw error;
      examMeta = data;
    }

    const report = {
      generatedAt: new Date().toISOString(),
      studentId: studentId || null,
      examId: examId || null,
      exam: examMeta,
      recentAttempts: attempts,
      summary: {
        message:
          'Curriculum-aligned report shell. Wire PDF rendering (e.g. pdfkit) in CI or Edge when needed.',
      },
    };

    if (format === 'pdf') {
      return res.status(501).json({
        error: 'PDF binary not implemented in this MVP; use format=json or generate-report Edge Function with storage upload.',
        report,
      });
    }

    return res.status(200).json({ report });
  } catch (e) {
    console.error('[report/generate]', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
