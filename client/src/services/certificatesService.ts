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

/** Generate a verification code (16 chars) using a cryptographically secure RNG */
function generateVerificationCode(): string {
  // chars.length MUST be 32 (a power of 2) so the bitwise mask below produces an unbiased index
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars
  const length = 16;
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);
  let code = '';
  for (let i = 0; i < length; i++) {
    // 32 === 0b100000, so mask with 0x1f (31) gives an unbiased index into chars
    code += chars.charAt(randomBytes[i] & 0x1f);
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
