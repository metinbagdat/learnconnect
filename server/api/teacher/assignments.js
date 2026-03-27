import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { teacherId, studentId, status } = req.query;

    if (!teacherId) {
      return res.status(400).json({ error: 'teacherId gerekli' });
    }

    try {
      let query = supabase
        .from('teacher_assignments')
        .select(`
          id, teacher_id, student_id, topic_id, note, due_at, status, created_at, completed_at,
          topics:topic_id(id, name, difficulty_level, subjects:subject_id(name), units:unit_id(name))
        `)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (studentId) query = query.eq('student_id', studentId);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ success: true, assignments: data || [] });
    } catch (err) {
      console.error('teacher assignments GET error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    const { teacherId, studentId, studentIds, topicId, dueAt, note } = req.body;

    const normalizedStudentIds = Array.isArray(studentIds)
      ? studentIds.map(s => String(s).trim()).filter(Boolean)
      : studentId
        ? [String(studentId).trim()]
        : [];

    const uniqueStudentIds = [...new Set(normalizedStudentIds)];

    if (!teacherId || uniqueStudentIds.length === 0 || !topicId) {
      return res.status(400).json({ error: 'teacherId, studentId/studentIds, topicId gerekli' });
    }

    try {
      const { data: existingPending, error: existingErr } = await supabase
        .from('teacher_assignments')
        .select('student_id')
        .eq('teacher_id', teacherId)
        .eq('topic_id', topicId)
        .eq('status', 'pending')
        .in('student_id', uniqueStudentIds);

      if (existingErr) return res.status(500).json({ error: existingErr.message });

      const pendingSet = new Set((existingPending || []).map(r => r.student_id));
      const insertableStudentIds = uniqueStudentIds.filter(id => !pendingSet.has(id));

      if (insertableStudentIds.length === 0) {
        return res.status(200).json({
          success: true,
          assignments: [],
          insertedCount: 0,
          skippedCount: uniqueStudentIds.length,
          skippedStudentIds: uniqueStudentIds,
          message: 'Tüm seçili öğrencilerde bu konu için bekleyen görev zaten var.',
        });
      }

      const rows = insertableStudentIds.map(id => ({
        teacher_id: teacherId,
        student_id: id,
        topic_id: topicId,
        due_at: dueAt || null,
        note: note || null,
        status: 'pending',
      }));

      const { data, error } = await supabase
        .from('teacher_assignments')
        .insert(rows)
        .select();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({
        success: true,
        assignments: data || [],
        insertedCount: (data || []).length,
        skippedCount: uniqueStudentIds.length - insertableStudentIds.length,
        skippedStudentIds: uniqueStudentIds.filter(id => pendingSet.has(id)),
      });
    } catch (err) {
      console.error('teacher assignments POST error:', err);
      if (String(err.message || '').toLowerCase().includes('duplicate key')) {
        return res.status(409).json({
          error: 'Aynı öğrenci ve konu için bekleyen görev zaten mevcut.',
          code: 'DUPLICATE_PENDING_ASSIGNMENT',
        });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'PATCH') {
    const { assignmentId, action } = req.body;

    if (!assignmentId || !action) {
      return res.status(400).json({ error: 'assignmentId ve action gerekli' });
    }

    try {
      if (action === 'cancel') {
        const { data, error } = await supabase
          .from('teacher_assignments')
          .update({ status: 'cancelled' })
          .eq('id', assignmentId)
          .select()
          .single();

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true, assignment: data });
      }

      return res.status(400).json({ error: 'Gecersiz action' });
    } catch (err) {
      console.error('teacher assignments PATCH error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
