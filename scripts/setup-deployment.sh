#!/bin/bash

# LearnConnect Deployment Setup Script
# Bu script tüm deployment adımlarını otomatikleştirir

set -e  # Hata durumunda dur

echo "🚀 LearnConnect Deployment Setup Başlatılıyor..."
echo ""

# Renkler
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Firebase CLI Kontrolü
echo "1️⃣  Firebase CLI kontrol ediliyor..."
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Firebase CLI bulunamadı, kuruluyor...${NC}"
    npm install -g firebase-tools
else
    echo -e "${GREEN}✅ Firebase CLI kurulu${NC}"
fi

# 2. Firebase Login Kontrolü
echo ""
echo "2️⃣  Firebase login kontrol ediliyor..."
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Firebase'e login olunması gerekiyor...${NC}"
    firebase login
else
    echo -e "${GREEN}✅ Firebase'e login olunmuş${NC}"
fi

# 3. Firestore Rules Deploy
echo ""
echo "3️⃣  Firestore rules deploy ediliyor..."
if [ -f "firestore.rules" ]; then
    firebase deploy --only firestore:rules
    echo -e "${GREEN}✅ Firestore rules deploy edildi${NC}"
else
    echo -e "${RED}❌ firestore.rules dosyası bulunamadı!${NC}"
    exit 1
fi

# 4. Service Account Key Kontrolü
echo ""
echo "4️⃣  Service Account Key kontrol ediliyor..."
if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo -e "${YELLOW}⚠️  GOOGLE_APPLICATION_CREDENTIALS ayarlanmamış${NC}"
    echo -e "${YELLOW}   Admin kullanıcı oluşturmak için:${NC}"
    echo -e "${YELLOW}   export GOOGLE_APPLICATION_CREDENTIALS=\"./service-account-key.json\"${NC}"
    echo -e "${YELLOW}   node scripts/init-admin.js${NC}"
else
    echo -e "${GREEN}✅ Service Account Key ayarlanmış${NC}"
    
    # 5. Admin Kullanıcı Oluşturma (opsiyonel)
    echo ""
    read -p "5️⃣  Admin kullanıcı oluşturmak istiyor musunuz? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -f "scripts/init-admin.js" ]; then
            node scripts/init-admin.js
        else
            echo -e "${RED}❌ scripts/init-admin.js bulunamadı!${NC}"
        fi
    fi
    
    # 6. MEB Müfredatı Ekleme (opsiyonel)
    echo ""
    read -p "6️⃣  MEB müfredatını eklemek istiyor musunuz? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -f "scripts/seed-meb-curriculum.js" ]; then
            node scripts/seed-meb-curriculum.js
        else
            echo -e "${RED}❌ scripts/seed-meb-curriculum.js bulunamadı!${NC}"
        fi
    fi
fi

# 7. Environment Variables Kontrolü
echo ""
echo "7️⃣  Environment variables kontrol ediliyor..."
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local dosyası mevcut${NC}"
    echo -e "${YELLOW}   Vercel'de environment variables'ı da ayarlamayı unutmayın!${NC}"
else
    echo -e "${YELLOW}⚠️  .env.local dosyası bulunamadı${NC}"
    echo -e "${YELLOW}   .env.example dosyasını kopyalayarak oluşturun${NC}"
fi

# 8. Build Test
echo ""
echo "8️⃣  Build test ediliyor..."
if npm run build &> /dev/null; then
    echo -e "${GREEN}✅ Build başarılı${NC}"
else
    echo -e "${RED}❌ Build başarısız! Hataları kontrol edin.${NC}"
    exit 1
fi

# 9. Vercel CLI Kontrolü
echo ""
echo "9️⃣  Vercel CLI kontrol ediliyor..."
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI bulunamadı, kuruluyor...${NC}"
    npm install -g vercel
else
    echo -e "${GREEN}✅ Vercel CLI kurulu${NC}"
fi

# 10. Özet
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Setup tamamlandı!${NC}"
echo ""
echo "📋 Sonraki Adımlar:"
echo "   1. Vercel Dashboard'da environment variables'ı ayarlayın"
echo "   2. Vercel'e deploy edin: vercel --prod"
echo "   3. Admin paneli test edin: https://your-project.vercel.app/admin"
echo ""
echo "📚 Detaylı bilgi için DEPLOYMENT_GUIDE.md dosyasına bakın"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
