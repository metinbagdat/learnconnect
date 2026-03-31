/**
 * /api/admin/ksdt-tables
 */
import { getSupabaseAdmin } from '../lib/supabase-admin.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    const supabase = getSupabaseAdmin();
    const method = req.method;

    if (method === 'GET') {
      const { data, error } = await supabase.from('ksdt_tables').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ tables: data });
    }

    if (method === 'POST') {
      const { name, description, examCategoryId, metadata, createdBy } = req.body || {};
      if (!name) {
        return res.status(400).json({ error: 'name is required' });
      }
      const { data, error } = await supabase
        .from('ksdt_tables')
        .insert({
          name,
          description: description || null,
          exam_category_id: examCategoryId || null,
          metadata: metadata || {},
          created_by: createdBy || null,
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json({ table: data });
    }

    if (method === 'PATCH') {
      const { id, ...rest } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      const patch = {};
      if (rest.name !== undefined) patch.name = rest.name;
      if (rest.description !== undefined) patch.description = rest.description;
      if (rest.examCategoryId !== undefined) patch.exam_category_id = rest.examCategoryId;
      if (rest.metadata !== undefined) patch.metadata = rest.metadata;
      const { data, error } = await supabase.from('ksdt_tables').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json({ table: data });
    }

    if (method === 'DELETE') {
      const id = req.query?.id || req.body?.id;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabase.from('ksdt_tables').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('[ksdt-tables]', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
