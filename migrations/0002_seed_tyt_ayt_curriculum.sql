-- migrations/0002_seed_tyt_ayt_curriculum.sql
-- TYT/AYT temel dersleri ve ünitelerini seed et

-- TYT DERSLER
INSERT INTO subjects (name, slug, description, exam_type, grade_level, display_order) VALUES
  ('Matematik', 'matematik', 'TYT Matematik - Sayılar, Üslü ve Köklü İfadeler, Basit Eşitsizlikler, Mutlak Değer, Rasyonel İfadeler, Oran-Orantı, Yüzde, İşçi-Havuz Problemleri, Kümeler, Fonksiyonlar, Polinomlar, Ikinci Dereceden Denklemler, Permütasyon-Kombinasyon, Olasılık, İstatistik', ARRAY['tyt'], 9, 1),
  ('Türkçe', 'turkce', 'TYT Türkçe - Paragraf, Anlatım Bozuklukları, Cümleleme Kuralları, Puan-Anlam İlişkisi', ARRAY['tyt'], 9, 2),
  ('Sosyal Bilgiler', 'sosyal-bilgiler', 'TYT Sosyal Bilgiler - Coğrafya, Tarih, Din Kültürü, Felsefe', ARRAY['tyt'], 9, 3),
  ('Fen Bilimleri', 'fen-bilimleri', 'TYT Fen Bilimleri - Fizik, Kimya, Biyoloji', ARRAY['tyt'], 9, 4),
  
-- AYT DERSLER
  ('Matematik (AYT)', 'matematik-ayt', 'AYT Matematik - Türev, İntegral, Limit, Logaritma, Trigonometri', ARRAY['ayt'], 11, 5),
  ('Fizik', 'fizik', 'AYT Fizik - Elektromanyetizma, Optik, Modern Fizik, Mekanik', ARRAY['ayt'], 11, 6),
  ('Kimya', 'kimya', 'AYT Kimya - Organik Kimya, Asit-Baz, Redoks, Elde Reaksiyonları', ARRAY['ayt'], 11, 7),
  ('Biyoloji', 'biyoloji', 'AYT Biyoloji - Genetik, Evrim, Hücre Biyolojisi, Fizyoloji', ARRAY['ayt'], 12, 8),
  ('Tarih', 'tarih', 'AYT Tarih - Osmanlı, Modern Türkiye, Dünya Tarihi', ARRAY['ayt'], 11, 9),
  ('Coğrafya', 'cografi', 'AYT Coğrafya - İnsan-Çevre İlişkisi, Doğal Sistemler, Beşeri Coğrafya', ARRAY['ayt'], 11, 10);

-- MATEMATİK ÜNİTELERİ
INSERT INTO units (subject_id, name, description, display_order) VALUES
  ((SELECT id FROM subjects WHERE slug = 'matematik'), 'Sayı Sistemleri', 'Doğal sayılar, tam sayılar, rasyonel sayılar, irrasyonel sayılar', 1),
  ((SELECT id FROM subjects WHERE slug = 'matematik'), 'Üslü ve Köklü İfadeler', 'Üslü ifadelerin özellikleri, köklü ifadelerin işlemleri', 2),
  ((SELECT id FROM subjects WHERE slug = 'matematik'), 'Eşitsizlikler', 'Birinci derece eşitsizlikler, basit eşitsizliklerin çözümü', 3),
  ((SELECT id FROM subjects WHERE slug = 'matematik'), 'Mutlak Değer', 'Mutlak değerin tanımı ve özellikleri', 4),
  ((SELECT id FROM subjects WHERE slug = 'matematik'), 'Rasyonel İfadeler', 'Kesir işlemleri, rasyonel ifadelerin sadeleştirilmesi', 5),
  ((SELECT id FROM subjects WHERE slug = 'matematik'), 'Oran-Orantı', 'Oranın tanımı, doğru ve ters orantı', 6),
  ((SELECT id FROM subjects WHERE slug = 'matematik'), 'Yüzde Problemleri', 'Yüzde hesapları, artış ve azalış problemleri', 7),
  ((SELECT id FROM subjects WHERE slug = 'matematik'), 'İşçi-Havuz Problemleri', 'Birlikte çalışma, akış hızı problemleri', 8),
  ((SELECT id FROM subjects WHERE slug = 'matematik'), 'Kümeler', 'Kümelerin tanımı, işlemleri, Venn diyagramları', 9),
  ((SELECT id FROM subjects WHERE slug = 'matematik'), 'Fonksiyonlar', 'Fonksiyon tanımı, değer bulma, görüntü kümesi', 10),
  ((SELECT id FROM subjects WHERE slug = 'matematik'), 'Polinomlar', 'Polinom tanımı, dereceyi belirleme, işlemler', 11),
  ((SELECT id FROM subjects WHERE slug = 'matematik'), 'Permütasyon-Kombinasyon', 'Sıralama, seçme, n! işlemleri', 12),
  ((SELECT id FROM subjects WHERE slug = 'matematik'), 'Olasılık', 'Olasılığın tanımı, basit olaylar, koşullu olasılık', 13),
  ((SELECT id FROM subjects WHERE slug = 'matematik'), 'İstatistik', 'Ortalama, ortanca, standart sapma', 14);

-- TÜRKÇE ÜNİTELERİ
INSERT INTO units (subject_id, name, description, display_order) VALUES
  ((SELECT id FROM subjects WHERE slug = 'turkce'), 'Paragraf Analizi', 'Tema, ana fikir, yardımcı fikirler', 1),
  ((SELECT id FROM subjects WHERE slug = 'turkce'), 'Anlatım Bozuklukları', 'Cümleleme hataları, mantık hataları', 2),
  ((SELECT id FROM subjects WHERE slug = 'turkce'), 'Edebiyat Terimleri', 'Yazı türleri, anlatım teknikleri, edebî figürler', 3),
  ((SELECT id FROM subjects WHERE slug = 'turkce'), 'Atasözü ve Deyimler', 'Mecazi anlamlar, idiyomatik kullanımlar', 4),
  ((SELECT id FROM subjects WHERE slug = 'turkce'), 'Yazım Kuralları', 'Yazılışları kontrol etme, biçim hataları', 5);

-- ÖRNEK KONULAR (Topics)
-- Matematik/Sayı Sistemleri konuları
INSERT INTO topics (unit_id, name, description, difficulty, estimated_minutes, is_tyt, is_ayt, display_order, learning_objectives, keywords) VALUES
  ((SELECT id FROM units WHERE name = 'Sayı Sistemleri' AND subject_id = (SELECT id FROM subjects WHERE slug = 'matematik')), 
   'Doğal Sayılar ve Özellikleri', 'Doğal sayıların tanımı, toplama ve çarpma işlemlerinin özellikleri', 1, 45, true, false, 1,
   ARRAY['Doğal sayıları tanımlama', 'İşlem özelliklerini anlama'], ARRAY['N', 'doğal', 'işlem']),
   
  ((SELECT id FROM units WHERE name = 'Sayı Sistemleri' AND subject_id = (SELECT id FROM subjects WHERE slug = 'matematik')), 
   'Tam Sayılar', 'Tam sayıların tanımı, mutlak değer, işlemler', 2, 50, true, false, 2,
   ARRAY['Tam sayıları tanımlama', 'Negatif sayılarla işlem'], ARRAY['Z', 'tam sayı', 'negatif']),
   
  ((SELECT id FROM units WHERE name = 'Sayı Sistemleri' AND subject_id = (SELECT id FROM subjects WHERE slug = 'matematik')), 
   'Rasyonel ve İrrasyonel Sayılar', 'Kesir gösterimi, irrasyonel sayıların tanımı', 3, 55, true, false, 3,
   ARRAY['Q ve Q\' nümayişi', 'Ondalık açılım'], ARRAY['kesir', 'rasyonel', 'irrasyonel']),

-- Matematik/Üslü ve Köklü İfadeler
  ((SELECT id FROM units WHERE name = 'Üslü ve Köklü İfadeler' AND subject_id = (SELECT id FROM subjects WHERE slug = 'matematik')), 
   'Üslü İfadelerin Tanımı ve Özellikleri', 'Pozitif tam sayı üsleri, negatif üsler, sıfır üssü', 2, 50, true, false, 1,
   ARRAY['Üs tanımını anlamak', 'İşlem kurallarını bilmek'], ARRAY['üs', 'kuvvet', 'a^n']),

-- Türkçe/Paragraf Analizi
  ((SELECT id FROM units WHERE name = 'Paragraf Analizi' AND subject_id = (SELECT id FROM subjects WHERE slug = 'turkce')), 
   'Tema ve Ana Fikir Belirleme', 'Metnin genel konusu, ana ve yardımcı fikirler', 2, 40, true, false, 1,
   ARRAY['Tema tanımlama', 'Ana fikri belirlemek'], ARRAY['tema', 'ana fikir', 'konu']),
   
  ((SELECT id FROM units WHERE name = 'Paragraf Analizi' AND subject_id = (SELECT id FROM subjects WHERE slug = 'turkce')), 
   'Anlatım Biçimi ve Tonu', 'Metnin sahip olduğu üslup, ton ve anlatım özellikleri', 3, 45, true, false, 2,
   ARRAY['Anlatım biçimini belirleme', 'Tonu ayırt etme'], ARRAY['ton', 'üslup', 'anlatım']),

-- Fen Bilimleri/Fizik
  ((SELECT id FROM units WHERE name = 'Harekete' AND subject_id = (SELECT id FROM subjects WHERE slug = 'fen-bilimleri')), 
   'Hız ve Hızlanma', 'Sabit ve değişken hız, ortalama hız, hızlanma', 2, 50, true, false, 1,
   ARRAY['Hız hesapları yapma', 'Hızlanma tanımlama'], ARRAY['hız', 'v', 'a']);
   
-- AYT Matematik/Türev
INSERT INTO units (subject_id, name, description, display_order) VALUES
  ((SELECT id FROM subjects WHERE slug = 'matematik-ayt'), 'Türev Tanımı ve Kuralları', 'Türevin limitle tanımı, türev kuralları', 1),
  ((SELECT id FROM subjects WHERE slug = 'matematik-ayt'), 'İntegral', 'Belirsiz integral, tanımlı integral, integral kuralları', 2),
  ((SELECT id FROM subjects WHERE slug = 'matematik-ayt'), 'Trigonometri', 'Trigonometrik fonksiyonlar, açı ilişkileri', 3),
  ((SELECT id FROM subjects WHERE slug = 'matematik-ayt'), 'Logaritma', 'Logaritmanın tanımı, özellikleri, denklemler', 4);

-- AYT Matematik/Türev Konuları
INSERT INTO topics (unit_id, name, description, difficulty, estimated_minutes, is_tyt, is_ayt, display_order, learning_objectives, keywords) VALUES
  ((SELECT id FROM units WHERE name = 'Türev Tanımı ve Kuralları' AND subject_id = (SELECT id FROM subjects WHERE slug = 'matematik-ayt')), 
   'Türevin Limitle Tanımı', 'Limit kavramı, türevin limitle tanımı, türevlenebilirlik', 4, 60, false, true, 1,
   ARRAY['Limiti anlamak', 'Türev tanımını bilmek'], ARRAY['limit', 'türev', 'f\' (x)']),
   
  ((SELECT id FROM units WHERE name = 'Türev Tanımı ve Kuralları' AND subject_id = (SELECT id FROM subjects WHERE slug = 'matematik-ayt')), 
   'Türev Alma Kuralları', 'Kuvvet kuralı, çarpım kuralı, bölüm kuralı, zincir kuralı', 4, 55, false, true, 2,
   ARRAY['Türev kurallarını bilmek', 'Kuralları uygulamak'], ARRAY['kural', 'çarpım', 'zincir']),
   
  ((SELECT id FROM units WHERE name = 'Türev Tanımı ve Kuralları' AND subject_id = (SELECT id FROM subjects WHERE slug = 'matematik-ayt')), 
   'Türevin Uygulamaları: Ekstremum ve Monotonluk', 'Maksimum, minimum, artan-azalan aralıklar', 5, 65, false, true, 3,
   ARRAY['Ekstremum bulma', 'Monotonluğu belirleme'], ARRAY['maksimum', 'minimum', 'artan']);

-- Not: Bu seed sadece yapı örneğidir. Gerçek müfredat daha kapsamlı olacaktır (~400+ konu).
-- Admin panelinden veya toplu import fonksiyonuyla daha fazla içerik eklenebilir.
