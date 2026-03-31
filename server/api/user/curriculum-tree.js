/**
 * GET /api/user/curriculum-tree
 * Student-safe read: same nodes as authenticated curriculum (service role used here for public catalog).
 * Optional: ?examCategoryId=
 *
 * For strict RLS-only access, switch client to anon Supabase + JWT; this route matches other user/* patterns.
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
    const examCategoryId = url.searchParams.get('examCategoryId');
    let q = supabase.from('curriculum_tree').select('*').order('sort_order', { ascending: true });
    if (examCategoryId) q = q.eq('exam_category_id', examCategoryId);
    const { data, error } = await q;
    if (error) throw error;
    return res.status(200).json({ nodes: data });
  } catch (e) {
    console.error('[user/curriculum-tree]', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
