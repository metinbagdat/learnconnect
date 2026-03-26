// api/admin/topics.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/admin/topics - Konular (unitId'ye göre filtrele)
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const unitId = url.searchParams.get('unitId');

    let query = supabase
      .from('topics')
      .select('*, units(name, subject_id, subjects(name))');
    
    if (unitId) {
      query = query.eq('unit_id', unitId);
    }

    const { data, error } = await query.order('display_order', { ascending: true });
    if (error) throw error;
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// POST /api/admin/topics - Yeni konu ekle
export async function POST(req) {
  try {
    const {
      unit_id,
      name,
      description,
      difficulty,
      estimated_minutes,
      is_tyt,
      is_ayt,
      learning_objectives,
      keywords
    } = await req.json();

    if (!unit_id || !name) {
      return new Response(JSON.stringify({ error: 'unit_id and name are required' }), { status: 400 });
    }

    const { data: topics } = await supabase
      .from('topics')
      .select('display_order')
      .eq('unit_id', unit_id)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (topics?.[0]?.display_order ?? -1) + 1;

    const { data, error } = await supabase
      .from('topics')
      .insert([
        {
          unit_id: unit_id,
          name,
          description,
          difficulty: difficulty || 3,
          estimated_minutes: estimated_minutes,
          is_tyt: is_tyt || false,
          is_ayt: is_ayt || false,
          learning_objectives: learning_objectives || [],
          keywords: keywords || [],
          display_order: nextOrder
        }
      ])
      .select();

    if (error) throw error;
    return new Response(JSON.stringify(data[0]), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// PUT /api/admin/topics/:id - Konuyu güncelle
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const {
      name,
      description,
      difficulty,
      estimatedMinutes,
      isTyt,
      isAyt,
      displayOrder,
      isActive,
      learningObjectives,
      keywords
    } = await req.json();

    const { data, error } = await supabase
      .from('topics')
      .update({
        name,
        description,
        difficulty,
        estimated_minutes: estimatedMinutes,
        is_tyt: isTyt,
        is_ayt: isAyt,
        display_order: displayOrder,
        is_active: isActive,
        learning_objectives: learningObjectives,
        keywords: keywords,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    if (data.length === 0) {
      return new Response(JSON.stringify({ error: 'Topic not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(data[0]), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// DELETE /api/admin/topics/:id - Konuyu sil
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
