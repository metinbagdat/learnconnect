#!/bin/bash
# scripts/setup-curriculum.sh
# 
# TYT/AYT Müfredatını Supabase'e Deploy Et ve Yükle
# Kullanım: bash scripts/setup-curriculum.sh

set -e

echo "🎓 LearnConnect Müfredat Kurulumu"
echo "=================================="

# Renkleri tanımla
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Adım 0: Environment kontrol
echo -e "\n${BLUE}[0/5]${NC} Environment kontrol ediliyor..."

if [ ! -f .env ] && [ ! -f .env.local ]; then
  echo -e "${YELLOW}⚠️  .env dosyası bulunamadı!${NC}"
  echo "Lütfen .env.local dosyasını oluştur ve ekle:"
  echo "  SUPABASE_URL=https://xxx.supabase.co"
  echo "  SUPABASE_ANON_KEY=xxx"
  echo "  SUPABASE_SERVICE_KEY=xxx"
  exit 1
fi

echo -e "${GREEN}✅ Environment dosyası bulundu${NC}"

# Adım 1: Dependencies
echo -e "\n${BLUE}[1/5]${NC} Bağımlılıklar yükleniyor..."
npm install
echo -e "${GREEN}✅ Bağımlılıklar yüklendi${NC}"

# Adım 2: Müfredat JSON'ı oluştur
echo -e "\n${BLUE}[2/5]${NC} Müfredat JSON dosyası oluşturuluyor..."
node scripts/generate-tyt-ayt-curriculum.js
echo -e "${GREEN}✅ Müfredat JSON'ı oluşturuldu${NC}"

# Adım 3: Supabase Migrations
echo -e "\n${BLUE}[3/5]${NC} Supabase migrations deploy ediliyor..."
echo -e "${YELLOW}💡 Yapılacak işlem:${NC}"
echo "  1. Supabase CLI login yap (tarayıcı açılacak)"
echo "  2. migrations/ klasöründeki SQL'ler çalıştırılacak"
echo ""

if command -v supabase &> /dev/null; then
  echo "Supabase CLI bulundu. Deploy başlıyor..."
  supabase db push || echo -e "${YELLOW}⚠️  CLI deploy başarısız oldu. Manuel adımları takip et.${NC}"
else
  echo -e "${YELLOW}⚠️  Supabase CLI bulunamadı.${NC}"
  echo "   Yükleme: npm install -g supabase"
  echo "   Sonra çalıştır: supabase login && supabase db push"
fi

echo -e "${GREEN}✅ Migrations adımı tamamlandı${NC}"

# Adım 4: Müfredat verileri yükle
echo -e "\n${BLUE}[4/5]${NC} Müfredat verileri API ilgili yükleniyor..."

# Sunucunun çalışıp çalışmadığını kontrol et
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "API sunucusu çalışıyor. Veri yükleniyor..."
  node scripts/import-curriculum-to-supabase.js
  echo -e "${GREEN}✅ Müfredat yüklendi${NC}"
else
  echo -e "${YELLOW}⚠️  API sunucusu çalışmıyor (http://localhost:3000)${NC}"
  echo "   Başka terminal'de çalıştır: npm run dev"
  echo "   Sonra tekrar dene: npm run import:curriculum"
fi

# Adım 5: Doğrulama
echo -e "\n${BLUE}[5/5]${NC} Kurulum doğrulanıyor..."

# Cypress testleri çalıştır (eğer varsa)
if [ -f cypress/e2e/curriculum.cy.js ]; then
  echo "Curriculum testleri çalıştırılıyor..."
  npm run test:curriculum || echo -e "${YELLOW}⚠️  Bazı testler başarısız oldu${NC}"
fi

echo -e "\n${GREEN}✅ Kurulum tamamlandı!${NC}"

echo -e "\n${BLUE}📊 Sonraki Adımlar:${NC}"
echo "  1. Admin Dashboard'ı aç: http://localhost:3000/admin"
echo "  2. Müfredatı gör ve düzenle"
echo "  3. Öğrenci seçimi test et: http://localhost:3000/onboarding"
echo "  4. AI Coach ile günlük plan oluştur"

echo -e "\n${BLUE}📚 Kaynaklar:${NC}"
echo "  - Setup Rehberi: ./CURRICULUM_SETUP.md"
echo "  - API Dokümantasyon: ./api/admin/README.md"
echo "  - Completion Guide: ./ADIM_1_TAMAMLANDI.md"
