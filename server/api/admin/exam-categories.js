/**
 * /api/admin/exam-categories
 * CRUD for TYT / AYT / MEB buckets used by curriculum tree & KSDT.
 */
import { getSupabaseAdmin } from '../lib/supabase-admin.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    const supabase = getSupabaseAdmin();
    const method = req.method;

    if (method === 'GET') {
      const { data, error } = await supabase
        .from('exam_categories')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return res.status(200).json({ categories: data });
    }

    if (method === 'POST') {
      const { slug, name, examType, description, displayOrder, metadata } = req.body || {};
      if (!slug || !name) {
        return res.status(400).json({ error: 'slug and name are required' });
      }
      const { data, error } = await supabase
        .from('exam_categories')
        .insert({
          slug,
          name,
          exam_type: examType || null,
          description: description || null,
          display_order: displayOrder ?? 0,
          metadata: metadata || {},
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json({ category: data });
    }

    if (method === 'PATCH') {
      const { id, ...rest } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      const patch = {};
      if (rest.name !== undefined) patch.name = rest.name;
      if (rest.slug !== undefined) patch.slug = rest.slug;
      if (rest.examType !== undefined) patch.exam_type = rest.examType;
      if (rest.description !== undefined) patch.description = rest.description;
      if (rest.displayOrder !== undefined) patch.display_order = rest.displayOrder;
      if (rest.metadata !== undefined) patch.metadata = rest.metadata;
      const { data, error } = await supabase.from('exam_categories').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json({ category: data });
    }

    if (method === 'DELETE') {
      const id = req.query?.id || req.body?.id;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabase.from('exam_categories').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('[exam-categories]', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
