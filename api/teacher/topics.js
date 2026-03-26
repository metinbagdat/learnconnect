import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { search = '', limit = 300 } = req.query;

  try {
    let query = supabase
      .from('topics')
      .select('id, name, difficulty_level, subjects:subject_id(name), units:unit_id(name)')
      .order('name', { ascending: true })
      .limit(Number(limit));

    const searchText = String(search).trim();
    if (searchText) {
      query = query.ilike('name', `%${searchText}%`);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ success: true, topics: data || [] });
  } catch (err) {
    console.error('teacher topics error:', err);
    return res.status(500).json({ error: err.message });
  }
}
