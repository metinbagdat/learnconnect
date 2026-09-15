/**
 * POST /api/exam/publish
 * Body: { examId: string }
 */
import { getSupabaseAdmin } from '../lib/supabase-admin.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { examId } = req.body || {};
    if (!examId) {
      return res.status(400).json({ error: 'examId is required' });
    }
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('exams')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', examId)
      .select()
      .single();
    if (error) throw error;
    return res.status(200).json({ exam: data });
  } catch (e) {
    console.error('[exam/publish]', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
