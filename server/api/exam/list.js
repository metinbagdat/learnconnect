/**
 * GET /api/exam/list?status=draft|published
 */
import { getSupabaseAdmin } from '../lib/supabase-admin.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url || '', 'http://localhost');
    const status = url.searchParams.get('status');
    let q = supabase.from('exams').select('*').order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return res.status(200).json({ exams: data });
  } catch (e) {
    console.error('[exam/list]', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
