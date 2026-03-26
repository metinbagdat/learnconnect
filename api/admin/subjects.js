// api/admin/subjects.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/admin/subjects - Tüm dersleri listele
export async function GET(req) {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// POST /api/admin/subjects - Yeni ders ekle
export async function POST(req) {
  try {
    const { name, slug, description, exams, gradeLevel } = await req.json();

    // Input validation
    if (!name || !slug) {
      return new Response(JSON.stringify({ error: 'Name and slug are required' }), { status: 400 });
    }

    const { data, error } = await supabase
      .from('subjects')
      .insert([
        {
          name,
          slug,
          description,
          exam_type: exams || [],
          grade_level: gradeLevel
        }
      ])
      .select();

    if (error) throw error;
    return new Response(JSON.stringify(data[0]), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// PUT /api/admin/subjects/:id - Dersi güncelle
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const { name, description, exams, gradeLevel, isActive, displayOrder } = await req.json();

    const { data, error } = await supabase
      .from('subjects')
      .update({
        name,
        description,
        exam_type: exams,
        grade_level: gradeLevel,
        is_active: isActive,
        display_order: displayOrder,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    if (data.length === 0) {
      return new Response(JSON.stringify({ error: 'Subject not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(data[0]), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// DELETE /api/admin/subjects/:id - Dersi sil
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
