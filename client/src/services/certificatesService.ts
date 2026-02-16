import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  Timestamp,
  limit,
} from 'firebase/firestore';

export interface Certificate {
  id: string;
  userId: string;
  userName?: string;
  title: string;
  description: string;
  type: 'path' | 'course';
  pathId?: string;
  courseId?: string;
  pathTitle?: string;
  courseTitle?: string;
  issuedAt: any;
  verificationCode: string;
  metadata?: Record<string, unknown>;
}

/** Generate a short verification code (8 chars) */
function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Check if user already has a certificate for this path
 */
export async function hasPathCertificate(userId: string, pathId: string): Promise<boolean> {
  const certsRef = collection(db, 'certificates');
  const q = query(
    certsRef,
    where('userId', '==', String(userId)),
    where('pathId', '==', pathId),
    limit(1)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Issue a certificate when a path or course is completed
 */
export async function issueCertificate(
  userId: string,
  userName: string,
  type: 'path' | 'course',
  pathId?: string,
  pathTitle?: string,
  courseId?: string,
  courseTitle?: string
): Promise<string> {
  const verificationCode = generateVerificationCode();

  const title = type === 'path' ? pathTitle || 'Öğrenme Yolu Tamamlama' : courseTitle || 'Kurs Tamamlama';
  const description =
    type === 'path'
      ? `${pathTitle || 'Öğrenme yolunu'} başarıyla tamamladığını doğrular.`
      : `${courseTitle || 'Kursu'} başarıyla tamamladığını doğrular.`;

  const docRef = await addDoc(collection(db, 'certificates'), {
    userId: String(userId),
    userName,
    title,
    description,
    type,
    pathId: pathId || null,
    courseId: courseId || null,
    pathTitle: pathTitle || null,
    courseTitle: courseTitle || null,
    issuedAt: Timestamp.now(),
    verificationCode,
    metadata: {},
  });

  return docRef.id;
}

/**
 * Get user's certificates
 */
export async function getUserCertificates(userId: string): Promise<Certificate[]> {
  const certsRef = collection(db, 'certificates');
  const q = query(
    certsRef,
    where('userId', '==', String(userId)),
    orderBy('issuedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Certificate[];
}

/**
 * Verify certificate by verification code (public)
 */
export async function verifyCertificateByCode(verificationCode: string): Promise<Certificate | null> {
  const certsRef = collection(db, 'certificates');
  const q = query(
    certsRef,
    where('verificationCode', '==', verificationCode),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Certificate;
}
