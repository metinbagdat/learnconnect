/**
 * /api/admin/ksdt-rows
 * GET ?tableId=uuid
 * POST / PATCH / DELETE
 */
import { getSupabaseAdmin } from '../lib/supabase-admin.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    const supabase = getSupabaseAdmin();
    const method = req.method;
    const url = new URL(req.url || '', 'http://localhost');
    const tableId = url.searchParams.get('tableId') || req.query?.tableId;

    if (method === 'GET') {
      if (!tableId) {
        return res.status(400).json({ error: 'tableId query param is required' });
      }
      const { data: rows, error } = await supabase
        .from('ksdt_rows')
        .select('*')
        .eq('ksdt_table_id', tableId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      const loIds = [...new Set((rows || []).map((r) => r.learning_objective_id).filter(Boolean))];
      let loMap = {};
      if (loIds.length) {
        const { data: los, error: loErr } = await supabase.from('curriculum_tree').select('*').in('id', loIds);
        if (loErr) throw loErr;
        loMap = Object.fromEntries((los || []).map((c) => [c.id, c]));
      }
      const enriched = (rows || []).map((r) => ({
        ...r,
        learning_objective: r.learning_objective_id ? loMap[r.learning_objective_id] || null : null,
      }));
      return res.status(200).json({ rows: enriched });
    }

    if (method === 'POST') {
      const {
        ksdtTableId,
        learningObjectiveId,
        questionCount,
        difficulty,
        questionType,
        sortOrder,
        metadata,
      } = req.body || {};
      if (!ksdtTableId) {
        return res.status(400).json({ error: 'ksdtTableId is required' });
      }
      const { data, error } = await supabase
        .from('ksdt_rows')
        .insert({
          ksdt_table_id: ksdtTableId,
          learning_objective_id: learningObjectiveId || null,
          question_count: questionCount ?? 1,
          difficulty: difficulty || 'medium',
          question_type: questionType || 'multiple_choice',
          sort_order: sortOrder ?? 0,
          metadata: metadata || {},
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json({ row: data });
    }

    if (method === 'PATCH') {
      const { id, ...rest } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      const patch = {};
      if (rest.learningObjectiveId !== undefined) patch.learning_objective_id = rest.learningObjectiveId;
      if (rest.questionCount !== undefined) patch.question_count = rest.questionCount;
      if (rest.difficulty !== undefined) patch.difficulty = rest.difficulty;
      if (rest.questionType !== undefined) patch.question_type = rest.questionType;
      if (rest.sortOrder !== undefined) patch.sort_order = rest.sortOrder;
      if (rest.metadata !== undefined) patch.metadata = rest.metadata;
      const { data, error } = await supabase.from('ksdt_rows').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json({ row: data });
    }

    if (method === 'DELETE') {
      const id = req.query?.id || req.body?.id;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabase.from('ksdt_rows').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('[ksdt-rows]', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
