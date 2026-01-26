/**
 * Admin Kullanıcı Oluşturma Scripti
 * 
 * Kullanım:
 *   node scripts/init-admin.js
 * 
 * Gereksinimler:
 *   - Firebase Admin SDK service account key
 *   - GOOGLE_APPLICATION_CREDENTIALS environment variable
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Service account key kontrolü
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('❌ GOOGLE_APPLICATION_CREDENTIALS environment variable ayarlanmamış!');
  console.log('📝 Örnek: export GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"');
  process.exit(1);
}

// Firebase Admin SDK'yı başlat
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
  console.log('✅ Firebase Admin SDK başlatıldı');
} catch (error) {
  console.error('❌ Firebase Admin SDK başlatılamadı:', error.message);
  process.exit(1);
}

const auth = admin.auth();
const firestore = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdminUser() {
  try {
    console.log('\n🔐 Admin Kullanıcı Oluşturma\n');
    
    // Kullanıcı bilgilerini al
    const email = await question('📧 Admin email: ');
    if (!email || !email.includes('@')) {
      console.error('❌ Geçerli bir email adresi girin!');
      rl.close();
      return;
    }

    const password = await question('🔑 Şifre (min 6 karakter): ');
    if (!password || password.length < 6) {
      console.error('❌ Şifre en az 6 karakter olmalı!');
      rl.close();
      return;
    }

    const displayName = await question('👤 İsim (opsiyonel): ') || 'Admin User';

    console.log('\n⏳ Kullanıcı oluşturuluyor...');

    // Kullanıcıyı oluştur
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: displayName,
        emailVerified: false
      });
      console.log('✅ Kullanıcı oluşturuldu:', userRecord.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️  Kullanıcı zaten mevcut, mevcut kullanıcıyı kullanıyoruz...');
        userRecord = await auth.getUserByEmail(email);
      } else {
        throw error;
      }
    }

    // Admin claim ekle (Firebase Auth custom claims)
    try {
      await auth.setCustomUserClaims(userRecord.uid, { admin: true });
      console.log('✅ Admin claim eklendi');
    } catch (error) {
      console.error('⚠️  Admin claim eklenemedi:', error.message);
    }

    // Firestore'da admin dokümanı oluştur
    try {
      const adminRef = firestore.collection('admins').doc(userRecord.uid);
      await adminRef.set({
        email: email,
        name: displayName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Firestore admin dokümanı oluşturuldu');
    } catch (error) {
      console.error('❌ Firestore admin dokümanı oluşturulamadı:', error.message);
    }

    // Kullanıcı koleksiyonuna da ekle (eğer varsa)
    try {
      const userRef = firestore.collection('users').doc(userRecord.uid);
      await userRef.set({
        email: email,
        name: displayName,
        role: 'admin',
        admin: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log('✅ Kullanıcı koleksiyonuna eklendi');
    } catch (error) {
      console.warn('⚠️  Kullanıcı koleksiyonuna eklenemedi (opsiyonel):', error.message);
    }

    console.log('\n🎉 Admin kullanıcı başarıyla oluşturuldu!');
    console.log('\n📋 Bilgiler:');
    console.log('   Email:', email);
    console.log('   UID:', userRecord.uid);
    console.log('   Name:', displayName);
    console.log('\n💡 Not: Kullanıcının ilk login\'de şifresini değiştirmesi önerilir.');

  } catch (error) {
    console.error('\n❌ Hata:', error.message);
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Script'i çalıştır
createAdminUser();
