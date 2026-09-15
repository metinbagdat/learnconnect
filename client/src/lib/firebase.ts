import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { collection, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Read env vars and coerce to strings (Vite inlines these at build time)
const raw = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const firebaseConfig = {
  apiKey: String(raw.apiKey ?? '').trim(),
  authDomain: String(raw.authDomain ?? '').trim(),
  projectId: String(raw.projectId ?? '').trim(),
  storageBucket: String(raw.storageBucket ?? '').trim(),
  messagingSenderId: String(raw.messagingSenderId ?? '').trim(),
  appId: String(raw.appId ?? '').trim(),
  measurementId: raw.measurementId ? String(raw.measurementId).trim() : undefined,
};

// Accept real Firebase API keys (start with AIzaSy)
const hasValidFirebaseKey = (key: string | undefined): boolean =>
  Boolean(
    typeof key === 'string' &&
    key.length > 30 &&
    key.startsWith('AIzaSy')
  );

export const isFirebaseConfigured = Boolean(
  hasValidFirebaseKey(firebaseConfig.apiKey) &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

// Initialize Firebase only when all required keys exist
let app: FirebaseApp | null = null;
let _db: ReturnType<typeof getFirestore> | null = null;
let _auth: ReturnType<typeof getAuth> | null = null;

if (isFirebaseConfigured) {
  try {
    // Pass a plain object to avoid SES/lockdown tampering with frozen configs
    const configForInit = JSON.parse(JSON.stringify(firebaseConfig));
    app = getApps().length ? getApp() : initializeApp(configForInit);
    _db = getFirestore(app);
    _auth = getAuth(app);
    console.info('[LearnConnect] Firebase initialized successfully');
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(
        '[LearnConnect] Firebase init failed. Check VITE_FIREBASE_API_KEY in .env and restart dev server.'
      );
    }
    console.warn('[LearnConnect] Firebase initialization error:', error);
    app = null;
    _db = null;
    _auth = null;
  }
} else if (typeof window !== 'undefined') {
  if (import.meta.env.DEV && !firebaseConfig.apiKey) {
    console.warn(
      '[LearnConnect] VITE_FIREBASE_API_KEY is missing. Add it to .env and restart `npm run dev`.'
    );
  }
  console.info(
    '[LearnConnect] Firebase not configured (missing VITE_FIREBASE_* env vars). Using mock data.'
  );
}

export const db = _db;
export const auth = _auth;

// Initialize Analytics
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined' && app) {
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
  tytCurriculum: 'curriculum/tyt/subjects',
  studyPlans: 'study_plans',
  userProgress: 'user_progress',
  aiGeneratedPlans: 'ai_generated_plans',
  aiPlans: 'ai_generated_plans',
  notes: 'notes',
  studyStats: 'studyStats',
  learningPaths: 'learningPaths',
  userPathProgress: 'userPathProgress',
  courses: 'courses',
  lessons: 'lessons',
  communityPosts: 'communityPosts',
  comments: 'comments',
  certificates: 'certificates'
};

// Firestore collection references (client-side)
export const collectionRefs = _db
  ? {
      curriculum: collection(_db, 'curriculum'),
      tytSubjects: collection(_db, 'curriculum', 'tyt', 'subjects'),
      studyPlans: collection(_db, 'study_plans'),
      userProgress: collection(_db, 'user_progress'),
      aiGeneratedPlans: collection(_db, 'ai_generated_plans')
    }
  : null;

export default app;
