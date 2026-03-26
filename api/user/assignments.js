import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { userId, status } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId gerekli' });

    try {
      let query = supabase
        .from('teacher_assignments')
        .select(`
          id, teacher_id, student_id, topic_id, note, due_at, status, created_at, completed_at,
          topics:topic_id(id, name, difficulty_level, subjects:subject_id(name), units:unit_id(name))
        `)
        .eq('student_id', userId)
        .order('due_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ success: true, assignments: data || [] });
    } catch (err) {
      console.error('user assignments GET error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'PATCH') {
    const { assignmentId, status } = req.body;

    if (!assignmentId || !status) {
      return res.status(400).json({ error: 'assignmentId ve status gerekli' });
    }

    if (!['pending', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Gecersiz status' });
    }

    try {
      const payload = {
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      };

      const { data, error } = await supabase
        .from('teacher_assignments')
        .update(payload)
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true, assignment: data });
    } catch (err) {
      console.error('user assignments PATCH error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
