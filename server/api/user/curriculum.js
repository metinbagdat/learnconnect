// api/user/curriculum.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/user/curriculum
 * Öğrencinin seçtiği müfredatı getirir
 */
export async function GET(req) {
  try {
    const userId = req.headers.get('x-user-id') || req.user?.id;
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Öğrencinin seçtiği konuları ve ilişkili bilgileri getir
    const { data, error } = await supabase
      .from('user_curriculum')
      .select(`
        id,
        topic_id,
        status,
        completed_at,
        topics(
          id,
          name,
          description,
          difficulty,
          estimated_minutes,
          is_tyt,
          is_ayt,
          units(
            name,
            subjects(
              id,
              name,
              slug
            )
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'approved')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Derslere göre gruplan
    const grouped = {};
    data.forEach(item => {
      const subjectName = item.topics.units.subjects.name;
      if (!grouped[subjectName]) {
        grouped[subjectName] = [];
      }
      grouped[subjectName].push(item);
    });

    return new Response(JSON.stringify({ curriculum: grouped, totalTopics: data.length }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

/**
 * POST /api/user/curriculum
 * Öğrenci müfredatını onaylar (dersleri seçer)
 * 
 * Body:
 * {
 *   "subjects": ["subject-id-1", "subject-id-2"],
 *   "customMode": false,
 *   "examTypes": ["tyt", "ayt"]
 * }
 */
export async function POST(req) {
  try {
    const userId = req.headers.get('x-user-id') || req.user?.id;
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { subjects, customMode, examTypes } = await req.json();

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return new Response(JSON.stringify({ error: 'At least one subject must be selected' }), { status: 400 });
    }

    // Seçili dersler için tüm konuları bul
    let topicsQuery = supabase
      .from('topics')
      .select('id')
      .in('unit_id', 
        supabase
          .from('units')
          .select('id')
          .in('subject_id', subjects)
      );

    // İmtihanlar filtresi
    if (examTypes && examTypes.length > 0) {
      if (examTypes.includes('tyt')) {
        topicsQuery = topicsQuery.eq('is_tyt', true);
      } else if (examTypes.includes('ayt')) {
        topicsQuery = topicsQuery.eq('is_ayt', true);
      }
    }

    // Doğru sorgu yazı (Supabase subquery sınırlaması nedeniyle)
    const { data: topicsData, error: topicsError } = await supabase
      .from('topics')
      .select('id, units(subject_id)')
      .in('unit_id', 
        (await supabase
          .from('units')
          .select('id')
          .in('subject_id', subjects)).data?.map(u => u.id) || []
      );

    if (!topicsData || topicsData.length === 0) {
      return new Response(JSON.stringify({ error: 'No topics found for selected subjects' }), { status: 400 });
    }

    // Öğrenci tercihlerini kaydet
    const { error: prefsError } = await supabase
      .from('user_preferences')
      .upsert([
        {
          user_id: userId,
          selected_subjects: subjects,
          is_custom_curriculum: customMode,
          exam_type: examTypes || ['tyt', 'ayt']
        }
      ], { onConflict: 'user_id' });

    if (prefsError) throw prefsError;

    // Mevcut seçimleri sil (yeni seçimi başlangıç yap)
    await supabase
      .from('user_curriculum')
      .delete()
      .eq('user_id', userId);

    // Yeni müfredat onaylarını ekle
    const topicIds = topicsData.map(t => t.id);
    const curriculumData = topicIds.map(topicId => ({
      user_id: userId,
      topic_id: topicId,
      status: 'approved'
    }));

    const { error: currError } = await supabase
      .from('user_curriculum')
      .insert(curriculumData);

    if (currError) throw currError;

    return new Response(JSON.stringify({
      success: true,
      topicsApproved: topicIds.length,
      subjects: subjects,
      customMode,
      examTypes
    }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

/**
 * PUT /api/user/curriculum
 * Belirli bir konunun durumunu güncelle (skip, mark as complete)
 * 
 * Body: { "topicId": "...", "status": "approved|skipped|completed" }
 */
export async function PUT(req) {
  try {
    const userId = req.headers.get('x-user-id') || req.user?.id;
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { topicId, status } = await req.json();

    if (!['approved', 'skipped', 'completed'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status' }), { status: 400 });
    }

    const updateData = { status };
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('user_curriculum')
      .update(updateData)
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .select();

    if (error) throw error;
    if (data.length === 0) {
      return new Response(JSON.stringify({ error: 'Topic not found in curriculum' }), { status: 404 });
    }

    return new Response(JSON.stringify(data[0]), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

/**
 * DELETE /api/user/curriculum/:topicId
 * Konuyu müfredattan çıkar
 */
export async function DELETE(req, { params }) {
  try {
    const userId = req.headers.get('x-user-id') || req.user?.id;
    const { topicId } = params;
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { error } = await supabase
      .from('user_curriculum')
      .delete()
      .eq('user_id', userId)
      .eq('topic_id', topicId);

    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
