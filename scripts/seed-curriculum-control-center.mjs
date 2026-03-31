/**
 * Seed exam_categories + sample curriculum_tree nodes (TYT-style sample).
 * Run with service role (Node 20+): node scripts/seed-curriculum-control-center.mjs
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const { data: cat, error: cErr } = await supabase
    .from('exam_categories')
    .upsert(
      {
        slug: 'tyt-general',
        name: 'TYT (general)',
        exam_type: 'tyt',
        display_order: 1,
        description: 'Sample category for TYT-aligned tree',
      },
      { onConflict: 'slug' },
    )
    .select()
    .single();

  if (cErr) throw cErr;
  const categoryId = cat.id;

  const nodes = [
    { code: 'TYT.MAT', name: 'Mathematics', type: 'subject', parent_id: null },
    { code: 'TYT.MAT.U1', name: 'Numbers', type: 'unit', parent: 'TYT.MAT' },
    { code: 'TYT.MAT.U1.T1', name: 'Natural numbers', type: 'topic', parent: 'TYT.MAT.U1' },
    { code: 'TYT.MAT.U1.T1.LO1', name: 'Operations on natural numbers', type: 'learning_objective', parent: 'TYT.MAT.U1.T1' },
  ];

  const idByCode = {};

  for (const n of nodes) {
    const parentId = n.parent_id ?? (n.parent ? idByCode[n.parent] : null);
    const { data, error } = await supabase
      .from('curriculum_tree')
      .upsert(
        {
          code: n.code,
          name: n.name,
          type: n.type,
          parent_id: parentId,
          exam_category_id: categoryId,
          sort_order: 0,
          difficulty: 3,
          prerequisites: [],
          metadata: { source: 'seed' },
        },
        { onConflict: 'code' },
      )
      .select()
      .single();
    if (error) throw error;
    idByCode[n.code] = data.id;
  }

  const { data: ksdt, error: kErr } = await supabase
    .from('ksdt_tables')
    .insert({
      name: 'Sample TYT Math — Diagnostic',
      description: 'Seeded KSDT table',
      exam_category_id: categoryId,
    })
    .select()
    .single();

  if (kErr) throw kErr;

  const loId = idByCode['TYT.MAT.U1.T1.LO1'];
  if (loId) {
    await supabase.from('ksdt_rows').insert({
      ksdt_table_id: ksdt.id,
      learning_objective_id: loId,
      question_count: 3,
      difficulty: 'medium',
      question_type: 'multiple_choice',
      sort_order: 0,
    });
  }

  console.log('Seed OK. category:', categoryId, 'ksdt:', ksdt.id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
