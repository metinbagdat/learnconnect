// api/admin/curriculum-import.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Toplu müfredat yükleme (JSON formatı)
 * POST /api/admin/curriculum-import
 * 
 * Expected JSON format:
 * {
 *   "subjects": [
 *     {
 *       "name": "Matematik",
 *       "slug": "matematik",
 *       "exams": ["tyt", "ayt"],
 *       "gradeLevel": 9,
 *       "units": [
 *         {
 *           "name": "Türev",
 *           "topics": [
 *             {
 *               "name": "Türevin Tanımı",
 *               "difficulty": 3,
 *               "estimatedMinutes": 45,
 *               "isTyt": true,
 *               "isAyt": true
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
export async function POST(req) {
  try {
    const { subjects } = await req.json();

    if (!subjects || !Array.isArray(subjects)) {
      return new Response(
        JSON.stringify({ error: 'Invalid format. Expected { subjects: [...] }' }),
        { status: 400 }
      );
    }

    const importStats = {
      subjectsCreated: 0,
      unitsCreated: 0,
      topicsCreated: 0,
      errors: []
    };

    // İçiçe geçmiş veri yapısını işle
    for (const subjectData of subjects) {
      try {
        // Dersi oluştur
        const { data: subjectResult, error: subjectError } = await supabase
          .from('subjects')
          .insert([
            {
              name: subjectData.name,
              slug: subjectData.slug,
              description: subjectData.description,
              exam_type: subjectData.exams || [],
              grade_level: subjectData.gradeLevel
            }
          ])
          .select();

        if (subjectError) {
          importStats.errors.push(`Ders '${subjectData.name}' eklenirken hata: ${subjectError.message}`);
          continue;
        }

        const subjectId = subjectResult[0].id;
        importStats.subjectsCreated++;

        // Üniteler
        if (subjectData.units && Array.isArray(subjectData.units)) {
          for (let unitIndex = 0; unitIndex < subjectData.units.length; unitIndex++) {
            const unitData = subjectData.units[unitIndex];

            const { data: unitResult, error: unitError } = await supabase
              .from('units')
              .insert([
                {
                  subject_id: subjectId,
                  name: unitData.name,
                  description: unitData.description,
                  display_order: unitIndex
                }
              ])
              .select();

            if (unitError) {
              importStats.errors.push(
                `Ünite '${unitData.name}' (${subjectData.name}) eklenirken hata: ${unitError.message}`
              );
              continue;
            }

            const unitId = unitResult[0].id;
            importStats.unitsCreated++;

            // Konular
            if (unitData.topics && Array.isArray(unitData.topics)) {
              const topicsToInsert = unitData.topics.map((topicData, topicIndex) => ({
                unit_id: unitId,
                name: topicData.name,
                description: topicData.description,
                difficulty: topicData.difficulty || 3,
                estimated_minutes: topicData.estimatedMinutes,
                is_tyt: topicData.isTyt || false,
                is_ayt: topicData.isAyt || false,
                learning_objectives: topicData.learningObjectives || [],
                keywords: topicData.keywords || [],
                display_order: topicIndex
              }));

              const { error: topicsError } = await supabase
                .from('topics')
                .insert(topicsToInsert);

              if (topicsError) {
                importStats.errors.push(
                  `Konular '${unitData.name}' (${subjectData.name}) eklenirken hata: ${topicsError.message}`
                );
              } else {
                importStats.topicsCreated += topicsToInsert.length;
              }
            }
          }
        }
      } catch (error) {
        importStats.errors.push(`Ders '${subjectData.name}' işlenirken hata: ${error.message}`);
      }
    }

    return new Response(JSON.stringify(importStats), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

/**
 * Müfredat yapısını JSON olarak dışa aktarma
 * GET /api/admin/curriculum-import?format=json
 */
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'json';

    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select(`
        id,
        name,
        slug,
        description,
        exam_type,
        grade_level,
        display_order,
        units(
          id,
          name,
          description,
          display_order,
          topics(
            id,
            name,
            description,
            difficulty,
            estimated_minutes,
            is_tyt,
            is_ayt,
            learning_objectives,
            keywords,
            display_order
          )
        )
      `)
      .order('display_order', { ascending: true });

    if (subjectsError) throw subjectsError;

    // Dönüşüm
    const curriculum = {
      subjects: subjects.map(subject => ({
        name: subject.name,
        slug: subject.slug,
        description: subject.description,
        exams: subject.exam_type,
        gradeLevel: subject.grade_level,
        units: (subject.units || []).map(unit => ({
          name: unit.name,
          description: unit.description,
          topics: (unit.topics || []).map(topic => ({
            name: topic.name,
            description: topic.description,
            difficulty: topic.difficulty,
            estimatedMinutes: topic.estimated_minutes,
            isTyt: topic.is_tyt,
            isAyt: topic.is_ayt,
            learningObjectives: topic.learning_objectives,
            keywords: topic.keywords
          }))
        }))
      }))
    };

    if (format === 'csv') {
      // CSV formatı için simple dönüşüm
      let csv = 'Subject,Unit,Topic,Difficulty,EstimatedMinutes,IsTYT,IsAYT\n';
      for (const subject of curriculum.subjects) {
        for (const unit of subject.units || []) {
          for (const topic of unit.topics || []) {
            csv += `"${subject.name}","${unit.name}","${topic.name}",${topic.difficulty},${topic.estimatedMinutes},${topic.isTyt},${topic.isAyt}\n`;
          }
        }
      }
      return new Response(csv, {
        status: 200,
        headers: { 'Content-Type': 'text/csv' }
      });
    }

    return new Response(JSON.stringify(curriculum), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
