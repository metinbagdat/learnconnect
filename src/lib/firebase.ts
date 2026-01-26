/**
 * Firebase via CDN (window.firebase). No npm dependency – works when npm install fails (SSL etc.).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const firebase = typeof window !== 'undefined' ? (window as any).firebase : null;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase config eksik! VITE_FIREBASE_* env değişkenlerini kontrol edin.');
}

let app: any = null;
let _db: any = null;
let _auth: any = null;

if (firebase) {
  try {
    app = firebase.initializeApp(firebaseConfig);
    _auth = firebase.auth();
    _db = firebase.firestore();
  } catch (e) {
    console.error('❌ Firebase init hatası:', e);
  }
}

export const auth = _auth ?? null;
export const db = _db ?? null;

export function onAuthStateChanged(authInstance: any, cb: (u: any) => void) {
  if (!authInstance) return () => {};
  return authInstance.onAuthStateChanged(cb);
}

export function signOut(authInstance: any) {
  return authInstance ? authInstance.signOut() : Promise.resolve();
}

export function signInWithEmailAndPassword(authInstance: any, email: string, password: string) {
  if (!authInstance) return Promise.reject(new Error('Firebase Auth yok'));
  return authInstance.signInWithEmailAndPassword(email, password);
}

export function doc(firestore: any, ...pathSegments: string[]): any {
  if (!firestore || pathSegments.length < 2) return null;
  const [col, id, ...rest] = pathSegments;
  let ref: any = firestore.collection(col).doc(id);
  for (let i = 0; i < rest.length; i += 2) {
    const c = rest[i];
    const d = rest[i + 1];
    if (d != null) ref = ref.collection(c).doc(d);
  }
  return ref;
}

export function getDoc(ref: any) {
  return ref ? ref.get() : Promise.reject(new Error('Doc ref yok'));
}

export function collection(firestore: any, ...pathSegments: string[]): any {
  if (!firestore || pathSegments.length === 0) return null;
  if (pathSegments.length === 1) return firestore.collection(pathSegments[0]);
  const [col, id, ...rest] = pathSegments;
  let ref: any = firestore.collection(col).doc(id);
  for (let i = 0; i < rest.length; i += 2) {
    const c = rest[i];
    const d = rest[i + 1];
    if (d != null) ref = ref.collection(c).doc(d);
    else ref = ref.collection(c);
  }
  return ref;
}

export function getDocs(ref: any) {
  return ref ? ref.get() : Promise.reject(new Error('Collection ref yok'));
}

export function addDoc(ref: any, data: Record<string, unknown>) {
  return ref ? ref.add(data) : Promise.reject(new Error('Collection ref yok'));
}

export function deleteDoc(ref: any) {
  return ref ? ref.delete() : Promise.reject(new Error('Doc ref yok'));
}

export function updateDoc(ref: any, data: Record<string, unknown>) {
  return ref ? ref.update(data) : Promise.reject(new Error('Doc ref yok'));
}

export const analytics = null;

export const collections = {
  curriculum: 'curriculum',
  tytSubjects: 'curriculum/tyt/subjects',
  tytCurriculum: 'curriculum/tyt/subjects',
  studyPlans: 'study_plans',
  userProgress: 'user_progress',
  aiGeneratedPlans: 'ai_generated_plans',
  aiPlans: 'ai_generated_plans'
};

export default app;
