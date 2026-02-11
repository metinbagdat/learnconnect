const NOTES_API = '/api/data';

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
    const params = new URLSearchParams();
    params.set('userId', String(userId));
    if (limitCount) {
      params.set('limit', String(limitCount));
    }

    params.set('resource', 'notes');
    const response = await fetch(`${NOTES_API}?${params.toString()}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Notes request failed: ${response.status}`);
    }

    const notes = await response.json();
    return Array.isArray(notes) ? (notes as Note[]) : [];
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
    const response = await fetch(`${NOTES_API}?resource=notes&noteId=${encodeURIComponent(noteId)}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Note request failed: ${response.status}`);
    }

    const notes = await response.json();
    if (!Array.isArray(notes)) {
      return null;
    }

    return notes.find((note: Note) => note.id === noteId) || null;
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

    const response = await fetch(`${NOTES_API}?resource=notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        userId: String(userId),
        title: finalTitle,
        content,
        tags: tagsArray,
      }),
    });

    if (!response.ok) {
      throw new Error(`Create note failed: ${response.status}`);
    }

    const result = await response.json();
    return String(result?.id || '');
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

    const response = await fetch(`${NOTES_API}?resource=notes`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        noteId,
        title: finalTitle,
        content,
        tags: tagsArray,
      }),
    });

    if (!response.ok) {
      throw new Error(`Update note failed: ${response.status}`);
    }
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
    const response = await fetch(`${NOTES_API}?resource=notes`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ noteId }),
    });

    if (!response.ok) {
      throw new Error(`Delete note failed: ${response.status}`);
    }
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
