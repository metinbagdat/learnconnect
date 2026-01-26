/**
 * Setup Firestore Admin
 * Creates admin document in Firestore /admins collection
 * This script should be run after creating admin user in PostgreSQL
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin SDK
// You need to download service account key from Firebase Console
// Settings > Service Accounts > Generate New Private Key
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || './service-account-key.json';

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ Service account key not found at: ${serviceAccountPath}`);
  console.error('📥 Download it from: Firebase Console > Settings > Service Accounts > Generate New Private Key');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});

const db = admin.firestore();

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
}

async function setupFirestoreAdmin(adminUser: AdminUser) {
  try {
    console.log(`🔧 Setting up Firestore admin for: ${adminUser.email}`);
    
    // Check if admin already exists
    const adminDoc = await db.collection('admins').doc(adminUser.uid).get();
    
    if (adminDoc.exists) {
      console.log(`⚠️  Admin ${adminUser.uid} already exists in Firestore`);
      return { success: true, message: 'Admin already exists' };
    }
    
    // Create admin document
    await db.collection('admins').doc(adminUser.uid).set({
      email: adminUser.email,
      displayName: adminUser.displayName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true
    });
    
    console.log(`✅ Admin ${adminUser.email} added to Firestore`);
    return { success: true, message: 'Admin created successfully' };
  } catch (error) {
    console.error('❌ Error setting up Firestore admin:', error);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: ts-node setup-firestore-admin.ts <uid> <email> <displayName>');
    console.error('Example: ts-node setup-firestore-admin.ts abc123 admin@learnconnect.com "System Admin"');
    process.exit(1);
  }
  
  const [uid, email, displayName] = args;
  
  await setupFirestoreAdmin({ uid, email, displayName });
  
  console.log('✅ Firestore admin setup complete!');
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
