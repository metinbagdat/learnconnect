import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { collection, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

// Initialize Firebase only when all required keys exist (avoids auth/invalid-api-key in local dev)
let app: FirebaseApp | null = null;
let _db: ReturnType<typeof getFirestore> | null = null;
let _auth: ReturnType<typeof getAuth> | null = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  _db = getFirestore(app);
  _auth = getAuth(app);
} else if (typeof window !== 'undefined') {
  console.info(
    '[LearnConnect] Firebase not configured (missing VITE_FIREBASE_* env vars). Add .env.local with Firebase config for admin panel.'
  );
}

export const db = _db;
export const auth = _auth;

// Initialize Analytics (only in browser environment, only when configured)
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined' && app) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Firebase Analytics initialization failed:', error);
  }
}
export { analytics };

// Firestore collection references (string names only - safe without db)
export const collections = {
  curriculum: 'curriculum',
  tytSubjects: 'curriculum/tyt/subjects',
  tytCurriculum: 'curriculum/tyt/subjects', // Alias for compatibility
  studyPlans: 'study_plans',
  userProgress: 'user_progress',
  aiGeneratedPlans: 'ai_generated_plans',
  aiPlans: 'ai_generated_plans', // Alias for compatibility
  // New collections for Phase 1 MVP
  notes: 'notes',
  studyStats: 'studyStats',
  learningPaths: 'learningPaths',
  userPathProgress: 'userPathProgress',
  // Future collections (Phase 3-4)
  courses: 'courses',
  lessons: 'lessons',
  communityPosts: 'communityPosts',
  comments: 'comments',
  certificates: 'certificates'
};

// Firestore collection references (client-side)
export const collectionRefs = {
  curriculum: collection(db, 'curriculum'),
  tytSubjects: collection(db, 'curriculum', 'tyt', 'subjects'),
  studyPlans: collection(db, 'study_plans'),
  userProgress: collection(db, 'user_progress'),
  aiGeneratedPlans: collection(db, 'ai_generated_plans')
};

export default app;
