import { useState, useEffect } from 'react';
import { db, collection, getDocs, addDoc, deleteDoc, doc } from '@/lib/firebase';

export default function CurriculumManager() {
  const [examType, setExamType] = useState('TYT');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubject, setNewSubject] = useState({
    title: '',
    description: '',
    icon: '📚',
    color: 'blue',
    examType: 'TYT'
  });

  useEffect(() => {
    loadSubjects();
  }, [examType]);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'curriculum'));
      const data = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter(subject => subject.examType === examType);
      setSubjects(data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'curriculum'), {
        ...newSubject,
        examType,
        createdAt: new Date(),
        order: subjects.length + 1,
        topics: []
      });
      setNewSubject({ title: '', description: '', icon: '📚', color: 'blue', examType: 'TYT' });
      setShowAddForm(false);
      loadSubjects();
    } catch (error) {
      console.error('Error adding subject:', error);
      alert('Hata: ' + error.message);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!confirm('Bu dersi silmek istediğinizden emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'curriculum', id));
      loadSubjects();
    } catch (error) {
      console.error('Error deleting subject:', error);
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(subjects, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `curriculum-${examType}-${Date.now()}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">📚 Müfredat Yönetimi</h2>
          <p className="text-gray-600">Ders, konu ve alt konuları yönetin</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportJSON}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            📥 JSON Export
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ➕ Ders Ekle
          </button>
        </div>
      </div>

      {/* Exam Type Selector */}
      <div className="flex gap-2">
        {['TYT', 'AYT', 'YKS'].map((type) => (
          <button
            key={type}
            onClick={() => setExamType(type)}
            className={`px-6 py-2 rounded-lg font-medium ${
              examType === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Add Subject Form */}
      {showAddForm && (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-bold mb-4">Yeni Ders Ekle</h3>
          <form onSubmit={handleAddSubject} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ders Adı</label>
                <input
                  type="text"
                  value={newSubject.title}
                  onChange={(e) => setNewSubject({ ...newSubject, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="TYT Matematik"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Icon</label>
                <input
                  type="text"
                  value={newSubject.icon}
                  onChange={(e) => setNewSubject({ ...newSubject, icon: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="📚"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Açıklama</label>
              <textarea
                value={newSubject.description}
                onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows="3"
                placeholder="TYT matematik müfredatı..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Kaydet
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subjects List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-xl text-gray-500">📭 Henüz {examType} dersi eklenmemiş</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            İlk Dersi Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{subject.icon}</span>
                  <div>
                    <h3 className="font-bold text-lg">{subject.title}</h3>
                    <p className="text-sm text-gray-600">{subject.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-sm text-gray-500">
                  {subject.topics?.length || 0} konu
                </span>
                <button
                  onClick={() => handleDeleteSubject(subject.id)}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
                >
                  🗑️ Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
