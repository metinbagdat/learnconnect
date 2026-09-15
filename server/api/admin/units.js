// api/admin/units.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/admin/units - Üniteler (subjectId'ye göre filtrele)
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const subjectId = url.searchParams.get('subjectId');

    let query = supabase.from('units').select('*');
    
    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    const { data, error } = await query.order('display_order', { ascending: true });
    if (error) throw error;
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// POST /api/admin/units - Yeni ünite ekle
export async function POST(req) {
  try {
    const { subject_id, name, description } = await req.json();

    if (!subject_id || !name) {
      return new Response(JSON.stringify({ error: 'subject_id and name are required' }), { status: 400 });
    }

    const { data: units } = await supabase
      .from('units')
      .select('display_order')
      .eq('subject_id', subject_id)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (units?.[0]?.display_order ?? -1) + 1;

    const { data, error } = await supabase
      .from('units')
      .insert([
        {
          subject_id: subject_id,
          name,
          description,
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

// PUT /api/admin/units/:id - Üniteyi güncelle + sürükle-bırak sıralama
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const { name, description, displayOrder, isActive } = await req.json();

    const { data, error } = await supabase
      .from('units')
      .update({
        name,
        description,
        display_order: displayOrder,
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    if (data.length === 0) {
      return new Response(JSON.stringify({ error: 'Unit not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(data[0]), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// DELETE /api/admin/units/:id - Üniteyi sil
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    const { error } = await supabase
      .from('units')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
