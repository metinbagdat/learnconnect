import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Search, Plus, Calendar, Tag, Save, Trash2, X, Hash, Share2 } from 'lucide-react';
import MainNavbar from '@/components/layout/MainNavbar';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  getUserNotes,
  createNote,
  updateNote,
  deleteNote,
  getUserTags,
  type Note,
} from '@/services/notesService';

export default function Notebook() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState('');

  // Fetch notes
  useEffect(() => {
    if (!user?.username && !user?.id) return;

    const fetchNotes = async () => {
      try {
        const userId = String(user.id || user.username);
        const [fetchedNotes, tags] = await Promise.all([
          getUserNotes(userId),
          getUserTags(userId),
        ]);

        setNotes(fetchedNotes);
        setAllTags(tags);
      } catch (error) {
        console.error('Error fetching notes:', error);
      }
    };

    fetchNotes();
  }, [user]);

  // Check URL for note ID
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const noteId = params.get('note');
    if (noteId && notes.length > 0) {
      const note = notes.find(n => n.id === noteId);
      if (note) {
        setSelectedNote(note);
        setNoteTitle(note.title);
        setNoteContent(note.content);
        setNoteTags(note.tags?.join(', ') || '');
        setIsCreating(false);
      }
    }
  }, [location, notes]);

  // Filter notes based on search and tag
  const filteredNotes = notes.filter(note => {
    const matchesSearch =
      searchQuery === '' ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = !selectedTag || note.tags?.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  const handleNewNote = () => {
    setSelectedNote(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteTags('');
    setIsCreating(true);
    setLocation('/notebook');
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteTags(note.tags?.join(', ') || '');
    setIsCreating(false);
    setLocation(`/notebook?note=${note.id}`);
  };

  const handleSaveNote = async () => {
    if (!user?.id || (!noteTitle.trim() && !noteContent.trim())) return;

    try {
      const tags = noteTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(t => t.startsWith('#') ? t.slice(1) : t);

      const title = noteTitle.trim() || noteContent.substring(0, 50) || 'Yeni Not';

      if (selectedNote) {
        // Update existing note
        const noteRef = doc(db, 'notes', selectedNote.id);
        await updateDoc(noteRef, {
          title,
          content: noteContent,
          tags,
          updatedAt: Timestamp.now(),
        });
      } else {
        // Create new note
        await addDoc(collection(db, 'notes'), {
          userId: String(user.id),
          title,
          content: noteContent,
          tags,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }

      // Refresh notes
      const notesRef = collection(db, 'notes');
      const q = query(
        notesRef,
        where('userId', '==', String(user.id)),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const updatedNotes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Note[];
      setNotes(updatedNotes);

      // Clear form
      setSelectedNote(null);
      setNoteTitle('');
      setNoteContent('');
      setNoteTags('');
      setIsCreating(false);
      setLocation('/notebook');
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Not kaydedilirken hata oluştu');
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote || !confirm('Bu notu silmek istediğinize emin misiniz?')) return;

    try {
      await deleteNote(selectedNote.id);
      
      // Refresh notes and tags
      const userId = String(user?.id || user?.username);
      const [updatedNotes, updatedTags] = await Promise.all([
        getUserNotes(userId),
        getUserTags(userId),
      ]);

      setNotes(updatedNotes);
      setAllTags(updatedTags);

      // Clear selection
      setSelectedNote(null);
      setNoteTitle('');
      setNoteContent('');
      setNoteTags('');
      setIsCreating(false);
      setLocation('/notebook');
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Not silinirken hata oluştu');
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <MainNavbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Defterim</h1>
            <button
              onClick={handleNewNote}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Yeni Not</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar: Notes List + Tags */}
            <div className="lg:col-span-1 space-y-4">
              {/* Search */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Notlarda ara..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Tags Filter */}
              {allTags.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Tag className="h-5 w-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Etiketler</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedTag(null)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        !selectedTag
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Tümü
                    </button>
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedTag === tag
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Notlar ({filteredNotes.length})</h3>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredNotes.length > 0 ? (
                    filteredNotes.map(note => (
                      <div
                        key={note.id}
                        onClick={() => handleSelectNote(note)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedNote?.id === note.id
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <h4 className="font-medium text-gray-900 mb-1 line-clamp-1">{note.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{note.content}</p>
                        <div className="flex flex-wrap gap-1">
                          {note.tags?.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {note.updatedAt?.toDate?.().toLocaleDateString('tr-TR') ||
                            new Date(note.updatedAt?.seconds * 1000).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Henüz not yok</p>
                      <button
                        onClick={handleNewNote}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        İlk Notunu Oluştur
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side: Editor */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {selectedNote || isCreating ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedNote ? 'Notu Düzenle' : 'Yeni Not'}
                      </h2>
                      {selectedNote && (
                        <button
                          onClick={handleDeleteNote}
                          className="flex items-center space-x-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Sil</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Başlık
                        </label>
                        <input
                          type="text"
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          placeholder="Not başlığı..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          İçerik
                        </label>
                        <textarea
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="Notunuzu buraya yazın..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          rows={15}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Etiketler (virgülle ayırın)
                        </label>
                        <div className="flex items-center space-x-2">
                          <Hash className="h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            value={noteTags}
                            onChange={(e) => setNoteTags(e.target.value)}
                            placeholder="tyt, matematik, paragraf"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Örnek: tyt, matematik, paragraf (virgülle ayırın, # işareti otomatik eklenir)
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={handleSaveNote}
                          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Save className="h-4 w-4" />
                          <span>Kaydet</span>
                        </button>
                        <button
                          onClick={() => {
                            // Share to community
                            if (noteContent.trim()) {
                              const shareContent = `${noteTitle ? `**${noteTitle}**\n\n` : ''}${noteContent}`;
                              const shareTags = noteTags || '';
                              // Navigate to community with pre-filled content
                              setLocation(`/community?share=${encodeURIComponent(shareContent)}&tags=${encodeURIComponent(shareTags)}`);
                            }
                          }}
                          className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Share2 className="h-4 w-4" />
                          <span>Toplulukta Paylaş</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedNote(null);
                            setNoteTitle('');
                            setNoteContent('');
                            setNoteTags('');
                            setIsCreating(false);
                            setLocation('/notebook');
                          }}
                          className="flex items-center space-x-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <X className="h-4 w-4" />
                          <span>İptal</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16">
                    <div className="mb-4">
                      <Hash className="h-16 w-16 mx-auto text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Not Seçin veya Yeni Oluşturun</h3>
                    <p className="text-gray-600 mb-6">
                      Sol taraftan bir not seçin veya yeni bir not oluşturmak için "Yeni Not" butonuna tıklayın.
                    </p>
                    <button
                      onClick={handleNewNote}
                      className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Yeni Not Oluştur</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
