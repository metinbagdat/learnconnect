import { initializeApp } from 'firebase/app';
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize Analytics (only in browser environment)
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Firebase Analytics initialization failed:', error);
  }
}
export { analytics };

// Firestore collection references
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
