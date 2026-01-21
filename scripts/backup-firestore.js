#!/usr/bin/env node

/**
 * Firestore Backup Script
 * Automatically backs up Firestore data to JSON files
 * 
 * Usage:
 *   node scripts/backup-firestore.js
 * 
 * Environment variables needed:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_PRIVATE_KEY (service account)
 *   FIREBASE_CLIENT_EMAIL
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL
};

if (!serviceAccount.projectId) {
  console.error('❌ Missing Firebase credentials');
  console.log('Required env vars: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
  process.exit(1);
}

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);

// Collections to backup
const COLLECTIONS = [
  'curriculum',
  'users',
  'admins',
  'audit_logs',
  'study_plans',
  'ai_generated_plans'
];

async function backupCollection(collectionName) {
  console.log(`📦 Backing up ${collectionName}...`);
  
  try {
    const snapshot = await db.collection(collectionName).get();
    const data = {};
    
    for (const doc of snapshot.docs) {
      data[doc.id] = doc.data();
      
      // Backup subcollections if collection is curriculum
      if (collectionName === 'curriculum') {
        const subcollections = ['subjects', 'topics', 'subtopics'];
        for (const subName of subcollections) {
          try {
            const subSnapshot = await doc.ref.collection(subName).get();
            if (!subSnapshot.empty) {
              data[doc.id][subName] = {};
              subSnapshot.docs.forEach(subDoc => {
                data[doc.id][subName][subDoc.id] = subDoc.data();
              });
            }
          } catch (err) {
            // Subcollection might not exist
          }
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Error backing up ${collectionName}:`, error.message);
    return null;
  }
}

async function performBackup() {
  console.log('🚀 Starting Firestore backup...\n');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups', timestamp);
  
  // Create backup directory
  await fs.mkdir(backupDir, { recursive: true });
  
  const backup = {
    timestamp: new Date().toISOString(),
    collections: {}
  };
  
  // Backup each collection
  for (const collectionName of COLLECTIONS) {
    const data = await backupCollection(collectionName);
    if (data) {
      backup.collections[collectionName] = data;
      console.log(`✅ ${collectionName}: ${Object.keys(data).length} documents`);
    }
  }
  
  // Save backup file
  const backupFile = path.join(backupDir, 'firestore-backup.json');
  await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));
  
  // Save summary
  const summary = {
    timestamp: backup.timestamp,
    collections: Object.keys(backup.collections).map(name => ({
      name,
      documentCount: Object.keys(backup.collections[name]).length
    })),
    totalSize: Buffer.byteLength(JSON.stringify(backup))
  };
  
  await fs.writeFile(
    path.join(backupDir, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log(`\n✅ Backup completed successfully!`);
  console.log(`📁 Location: ${backupDir}`);
  console.log(`📊 Total size: ${(summary.totalSize / 1024 / 1024).toFixed(2)} MB`);
  
  return backupFile;
}

// Run backup
performBackup()
  .then(() => {
    console.log('\n🎉 Backup process finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Backup failed:', error);
    process.exit(1);
  });
