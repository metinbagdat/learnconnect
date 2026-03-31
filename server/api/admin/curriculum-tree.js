/**
 * /api/admin/curriculum-tree
 * GET: flat list (optional ?examCategoryId=)
 * POST: create node
 * PATCH: update node (move parent, rename, metadata, prerequisites)
 * DELETE: delete node (cascade children)
 */
import { getSupabaseAdmin } from '../lib/supabase-admin.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    const supabase = getSupabaseAdmin();
    const method = req.method;

    if (method === 'GET') {
      const url = new URL(req.url || '', 'http://localhost');
      const examCategoryId = url.searchParams.get('examCategoryId');
      let q = supabase.from('curriculum_tree').select('*').order('sort_order', { ascending: true });
      if (examCategoryId) {
        q = q.eq('exam_category_id', examCategoryId);
      }
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json({ nodes: data });
    }

    if (method === 'POST') {
      const {
        code,
        name,
        type,
        parentId,
        examCategoryId,
        sortOrder,
        difficulty,
        prerequisites,
        metadata,
      } = req.body || {};

      if (!code || !name || !type) {
        return res.status(400).json({ error: 'code, name, and type are required' });
      }

      const { data, error } = await supabase
        .from('curriculum_tree')
        .insert({
          code,
          name,
          type,
          parent_id: parentId || null,
          exam_category_id: examCategoryId || null,
          sort_order: sortOrder ?? 0,
          difficulty: difficulty ?? 3,
          prerequisites: prerequisites || [],
          metadata: metadata || {},
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({ node: data });
    }

    if (method === 'PATCH') {
      const { id, ...rest } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      const patch = {};
      if (rest.name !== undefined) patch.name = rest.name;
      if (rest.code !== undefined) patch.code = rest.code;
      if (rest.parentId !== undefined) patch.parent_id = rest.parentId;
      if (rest.examCategoryId !== undefined) patch.exam_category_id = rest.examCategoryId;
      if (rest.sortOrder !== undefined) patch.sort_order = rest.sortOrder;
      if (rest.difficulty !== undefined) patch.difficulty = rest.difficulty;
      if (rest.prerequisites !== undefined) patch.prerequisites = rest.prerequisites;
      if (rest.metadata !== undefined) patch.metadata = rest.metadata;
      if (rest.type !== undefined) patch.type = rest.type;

      const { data, error } = await supabase.from('curriculum_tree').update(patch).eq('id', id).select().single();

      if (error) throw error;
      return res.status(200).json({ node: data });
    }

    if (method === 'DELETE') {
      const id = req.query?.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }
      const { error } = await supabase.from('curriculum_tree').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('[curriculum-tree]', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
