/**
 * scripts/import-curriculum-to-supabase.js
 * 
 * TYT/AYT Müfredatını Supabase veritabanına yükle
 * Kullanım: node scripts/import-curriculum-to-supabase.js
 * 
 * Önce şunları yap:
 * 1. .env dosyasında SUPABASE_URL ve SUPABASE_SERVICE_KEY değerlerini ekle
 * 2. migrations/0001_curriculum_tables.sql dosyasını Supabase'de çalıştır
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase bağlantısı
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SUPABASE_SERVICE_KEY';

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_')) {
  console.error('❌ Hata: SUPABASE_URL ve SUPABASE_SERVICE_KEY ayarlanmadı!');
  console.error('   .env dosyasına bu değerleri ekleyin:');
  console.error('   SUPABASE_URL=https://xxx.supabase.co');
  console.error('   SUPABASE_SERVICE_KEY=your-service-key-here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// JSON verisini oku
const curriculumPath = path.join(__dirname, '..', 'curriculum-tyt-ayt-full.json');
const curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf-8'));

// Veriye UUID'ler ekle
import { v4 as uuidv4 } from 'uuid';

let stats = {
  subjectsCreated: 0,
  unitsCreated: 0,
  topicsCreated: 0,
  errors: []
};

async function importCurriculum() {
  console.log('🚀 Müfredat importu başlıyor...\n');

  for (const subject of curriculum.subjects) {
    try {
      const subjectId = uuidv4();
      
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .insert({
          id: subjectId,
          name: subject.name,
          slug: subject.slug,
          description: subject.description,
          exams: subject.exams,
          grade_level: subject.gradeLevel,
          display_order: curriculum.subjects.indexOf(subject)
        })
        .select()
        .single();

      if (subjectError) {
        throw subjectError;
      }

      stats.subjectsCreated++;
      console.log(`✅ ${subject.name} (${subject.units.length} üniteler)`);

      // Her ünitede konuları ekle
      for (const unit of subject.units) {
        try {
          const unitId = uuidv4();

          const { data: unitData, error: unitError } = await supabase
            .from('units')
            .insert({
              id: unitId,
              subject_id: subjectId,
              name: unit.name,
              description: unit.description,
              display_order: subject.units.indexOf(unit)
            })
            .select()
            .single();

          if (unitError) {
            throw unitError;
          }

          stats.unitsCreated++;

          // Konuları ekle
          for (const topic of unit.topics) {
            try {
              const topicId = uuidv4();

              const { data: topicData, error: topicError } = await supabase
                .from('topics')
                .insert({
                  id: topicId,
                  unit_id: unitId,
                  name: topic.name,
                  difficulty: topic.difficulty,
                  estimated_minutes: topic.estimatedMinutes,
                  is_tyt: topic.isTyt || false,
                  is_ayt: topic.isAyt || false,
                  display_order: unit.topics.indexOf(topic)
                })
                .select()
                .single();

              if (topicError) {
                throw topicError;
              }

              stats.topicsCreated++;
            } catch (error) {
              stats.errors.push(`Konu "${topic.name}" eklenemedi: ${error.message}`);
            }
          }
        } catch (error) {
          stats.errors.push(`Ünite "${unit.name}" eklenemedi: ${error.message}`);
        }
      }
    } catch (error) {
      stats.errors.push(`Dersi "${subject.name}" eklenemedi: ${error.message}`);
    }
  }

  // Sonuçları göster
  console.log('\n' + '='.repeat(50));
  console.log('📊 İmport Sonuçları:');
  console.log('='.repeat(50));
  console.log(`✅ Dersler: ${stats.subjectsCreated}`);
  console.log(`✅ Üniteler: ${stats.unitsCreated}`);
  console.log(`✅ Konular: ${stats.topicsCreated}`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Hatalar (${stats.errors.length}):`);
    stats.errors.slice(0, 5).forEach((err, i) => {
      console.log(`   ${i + 1}. ${err}`);
    });
    if (stats.errors.length > 5) {
      console.log(`   ... ve ${stats.errors.length - 5} hata daha`);
    }
  } else {
    console.log(`✅ Hatasız tamamlandı!`);
  }

  console.log('\n💡 Sonraki adımlar:');
  console.log('   1. Admin Dashboard\'ta dersleri görmek için tarayıcıyı yenile');
  console.log('   2. Adım 2: Öğrenci Seçm Onboarding UX\'i test et');
  console.log('   3. Adım 3: AI Coach planlama sistemini entegre et');
}

// İmport'u çalıştır
importCurriculum().catch(error => {
  console.error('❌ Kritik hata:', error);
  process.exit(1);
});
