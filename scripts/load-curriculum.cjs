/**
 * scripts/load-curriculum.cjs
 * 
 * Node.js CommonJS versiyonu - Supabase'den bağımsız,
 * API endpoint'i üzerinden müfredat yükle
 * 
 * Kullanım: node scripts/load-curriculum.cjs
 */

const fs = require('fs');
const path = require('path');

const API_BASE = process.env.API_URL || 'http://localhost:3000';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

async function loadCurriculum() {
  const curriculumPath = path.join(__dirname, '..', 'curriculum-tyt-ayt-full.json');
  const curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf-8'));

  console.log('🚀 Müfredat API\'ye yükleniyor...\n');

  try {
    const response = await fetch(`${API_BASE}/api/admin/curriculum-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': SERVICE_KEY ? `Bearer ${SERVICE_KEY}` : ''
      },
      body: JSON.stringify(curriculum)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Hatası: ${response.status} - ${error.message}`);
    }

    const result = await response.json();

    console.log('\n✅ Başarılı!');
    console.log(`   📚 Dersler: ${result.subjectsCreated}`);
    console.log(`   📖 Üniteler: ${result.unitsCreated}`);
    console.log(`   📄 Konular: ${result.topicsCreated}`);

    if (result.errors?.length) {
      console.log(`\n⚠️  Hatalar: ${result.errors.length}`);
      result.errors.slice(0, 3).forEach((err, i) => {
        console.log(`   ${i + 1}. ${err}`);
      });
    }
  } catch (error) {
    console.error('❌ Hata:', error.message);
    console.error('\n💡 Çözüm:');
    console.error('   1. API sunucusunun çalışıyor mu kontrol et: npm run dev');
    console.error('   2. SUPABASE_SERVICE_KEY environment variable\'ı ayarla');
    console.error('   3. migrations/0001_curriculum_tables.sql\'ı Supabase\'de çalıştır');
  }
}

loadCurriculum();
