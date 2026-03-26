/**
 * Quiz API - Soru Yönetimi
 * GET:  Bir konuya ait soruları getir (quiz başlatmak için)
 * POST: Yeni soru ekle (admin)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // GET: Konuya ait soruları getir
  if (req.method === 'GET') {
    const { topic_id, limit = 10, shuffle = 'true' } = req.query;

    if (!topic_id) {
      return res.status(400).json({ error: 'topic_id gerekli' });
    }

    const { data, error } = await supabase
      .from('questions')
      .select('id, text, type, options, difficulty, source')
      .eq('topic_id', topic_id)
      .eq('is_active', true);

    if (error) return res.status(500).json({ error: error.message });

    let questions = data || [];

    // Soruları karıştır
    if (shuffle === 'true') {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    // Limit uygula
    questions = questions.slice(0, parseInt(limit));

    return res.status(200).json({ success: true, questions, total: questions.length });
  }

  // PATCH: Soruyu güncelle (admin)
  if (req.method === 'PATCH') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id gerekli' });

    const { text, type, options, correct_answer, explanation, difficulty, source } = req.body;
    const update = {};
    if (text !== undefined) update.text = text;
    if (type !== undefined) update.type = type;
    if (options !== undefined) update.options = options;
    if (correct_answer !== undefined) update.correct_answer = correct_answer;
    if (explanation !== undefined) update.explanation = explanation;
    if (difficulty !== undefined) update.difficulty = difficulty;
    if (source !== undefined) update.source = source;

    const { data, error } = await supabase
      .from('questions')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, question: data });
  }

  // DELETE: Soruyu sil (admin)
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id gerekli' });

    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // POST: Yeni soru ekle (admin)
  if (req.method === 'POST') {
    const { topic_id, text, type = 'multiple_choice', options, correct_answer, explanation, difficulty, source } = req.body;

    if (!topic_id || !text || !correct_answer) {
      return res.status(400).json({ error: 'topic_id, text ve correct_answer gerekli' });
    }

    const { data, error } = await supabase
      .from('questions')
      .insert({
        topic_id,
        text,
        type,
        options,
        correct_answer,
        explanation,
        difficulty: difficulty || 3,
        source: source || null,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json({ success: true, question: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
