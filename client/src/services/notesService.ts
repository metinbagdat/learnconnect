import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  limit,
} from 'firebase/firestore';

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: any;
  updatedAt: any;
}

/**
 * Fetch all notes for a user, sorted by most recently updated
 */
export async function getUserNotes(userId: string, limitCount?: number): Promise<Note[]> {
  try {
    const notesRef = collection(db, 'notes');
    let q = query(
      notesRef,
      where('userId', '==', String(userId)),
      orderBy('updatedAt', 'desc')
    );

    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Note[];
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
}

/**
 * Get a single note by ID
 */
export async function getNoteById(noteId: string): Promise<Note | null> {
  try {
    const noteRef = doc(db, 'notes', noteId);
    const noteSnap = await getDocs(collection(db, 'notes'));
    const found = noteSnap.docs.find(d => d.id === noteId);
    
    if (!found) {
      return null;
    }

    return {
      id: found.id,
      ...found.data(),
    } as Note;
  } catch (error) {
    console.error('Error fetching note:', error);
    throw error;
  }
}

/**
 * Create a new note
 */
export async function createNote(
  userId: string,
  title: string,
  content: string,
  tags: string[]
): Promise<string> {
  try {
    const tagsArray = tags
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => t.startsWith('#') ? t.slice(1) : t);

    const finalTitle = title.trim() || content.substring(0, 50) || 'Yeni Not';

    const docRef = await addDoc(collection(db, 'notes'), {
      userId: String(userId),
      title: finalTitle,
      content,
      tags: tagsArray,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
}

/**
 * Update an existing note
 */
export async function updateNote(
  noteId: string,
  title: string,
  content: string,
  tags: string[]
): Promise<void> {
  try {
    const tagsArray = tags
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => t.startsWith('#') ? t.slice(1) : t);

    const finalTitle = title.trim() || content.substring(0, 50) || 'Yeni Not';

    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, {
      title: finalTitle,
      content,
      tags: tagsArray,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<void> {
  try {
    const noteRef = doc(db, 'notes', noteId);
    await deleteDoc(noteRef);
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
}

/**
 * Get all unique tags from user's notes
 */
export async function getUserTags(userId: string): Promise<string[]> {
  try {
    const notes = await getUserNotes(userId);
    const tags = new Set<string>();
    
    notes.forEach(note => {
      note.tags?.forEach(tag => tags.add(tag));
    });

    return Array.from(tags).sort();
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
}
