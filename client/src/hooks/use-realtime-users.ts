import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  studyHours?: number;
  totalStudyHours?: number;
  isActive: boolean;
  subscription?: 'free' | 'premium';
}

interface UseRealtimeUsersOptions {
  filter?: 'all' | 'active' | 'inactive' | 'premium';
  limitCount?: number;
}

/**
 * Custom hook for real-time user updates
 * Automatically syncs with Firestore changes
 */
export function useRealtimeUsers(options: UseRealtimeUsersOptions = {}) {
  const { filter = 'all', limitCount = 100 } = options;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    let q = query(collection(db, 'users'), limit(limitCount));

    // Apply filters
    if (filter === 'active') {
      q = query(collection(db, 'users'), where('isActive', '==', true), limit(limitCount));
    } else if (filter === 'inactive') {
      q = query(collection(db, 'users'), where('isActive', '==', false), limit(limitCount));
    } else if (filter === 'premium') {
      q = query(collection(db, 'users'), where('subscription', '==', 'premium'), limit(limitCount));
    }

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const usersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date()
          } as User));

          setUsers(usersData);
          setLoading(false);
        } catch (err) {
          console.error('Error processing users snapshot:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Users snapshot error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup listener
    return () => unsubscribe();
  }, [filter, limitCount]);

  return { users, loading, error };
}
