import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  orderBy 
} from 'firebase/firestore';
import { db, collections } from '@/lib/firebase';
import { BilingualText } from '@/components/ui/bilingual-text';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/consolidated-language-context';
import type { Subject, Topic, Subtopic } from '@/types/curriculum';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Upload, Download } from 'lucide-react';

type ExamType = 'tyt' | 'ayt' | 'yks';

export default function CurriculumManager() {
  const { language } = useLanguage();
  const [selectedExam, setSelectedExam] = useState<ExamType>('tyt');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  
  // Form states
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [showSubtopicForm, setShowSubtopicForm] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  
  const [newSubject, setNewSubject] = useState({
    title: '',
    description: '',
    icon: '📘',
    color: 'blue',
    order: 1,
    estimatedHours: 0,
    totalTopics: 0
  });

  const [newTopic, setNewTopic] = useState({
    name: '',
    order: 1,
    estimatedHours: 0,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard'
  });

  const [newSubtopic, setNewSubtopic] = useState({
    name: '',
    order: 1,
    estimatedMinutes: 60
  });

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const subjectsRef = collection(db, `curriculum/${selectedExam}/subjects`);
      const q = query(subjectsRef, orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      
      const subjectsData: Subject[] = [];
      for (const subjectDoc of snapshot.docs) {
        const subjectData = subjectDoc.data();
        
        // Load topics
        const topicsRef = collection(
          db, 
          `curriculum/${selectedExam}/subjects/${subjectDoc.id}/topics`
        );
        const topicsSnapshot = await getDocs(query(topicsRef, orderBy('order', 'asc')));
        
        const topics: Topic[] = [];
        for (const topicDoc of topicsSnapshot.docs) {
          const topicData = topicDoc.data();
          
          // Load subtopics
          const subtopicsRef = collection(
            db,
            `curriculum/${selectedExam}/subjects/${subjectDoc.id}/topics/${topicDoc.id}/subtopics`
          );
          const subtopicsSnapshot = await getDocs(query(subtopicsRef, orderBy('order', 'asc')));
          
          topics.push({
            id: topicDoc.id,
            ...topicData,
            subtopics: subtopicsSnapshot.docs.map(subDoc => ({
              id: subDoc.id,
              ...subDoc.data()
            } as Subtopic))
          } as Topic);
        }
        
        subjectsData.push({
          id: subjectDoc.id,
          ...subjectData,
          topics
        } as Subject);
      }
      
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, [selectedExam]);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const subjectWithMeta = {
        ...newSubject,
        examType: selectedExam,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await addDoc(
        collection(db, `curriculum/${selectedExam}/subjects`),
        subjectWithMeta
      );
      
      setNewSubject({
        title: '',
        description: '',
        icon: '📘',
        color: 'blue',
        order: 1,
        estimatedHours: 0,
        totalTopics: 0
      });
      setShowSubjectForm(false);
      await loadSubjects();
    } catch (error) {
      console.error('Error adding subject:', error);
      alert(language === 'tr' ? 'Ders eklenirken hata oluştu' : 'Error adding subject');
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const topicWithMeta = {
        ...newTopic,
        subjectId: selectedSubjectId,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(
        collection(db, `curriculum/${selectedExam}/subjects/${selectedSubjectId}/topics`),
        topicWithMeta
      );
      
      setNewTopic({
        name: '',
        order: 1,
        estimatedHours: 0,
        difficulty: 'medium'
      });
      setShowTopicForm(false);
      setSelectedSubjectId('');
      await loadSubjects();
    } catch (error) {
      console.error('Error adding topic:', error);
      alert(language === 'tr' ? 'Konu eklenirken hata oluştu' : 'Error adding topic');
    }
  };

  const handleAddSubtopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(
        collection(db, `curriculum/${selectedExam}/subjects/${selectedSubjectId}/topics/${selectedTopicId}/subtopics`),
        {
          ...newSubtopic,
          topicId: selectedTopicId,
          subjectId: selectedSubjectId,
          createdAt: new Date().toISOString()
        }
      );
      
      setNewSubtopic({
        name: '',
        order: 1,
        estimatedMinutes: 60
      });
      setShowSubtopicForm(false);
      setSelectedSubjectId('');
      setSelectedTopicId('');
      await loadSubjects();
    } catch (error) {
      console.error('Error adding subtopic:', error);
      alert(language === 'tr' ? 'Alt konu eklenirken hata oluştu' : 'Error adding subtopic');
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm(language === 'tr' ? 'Bu dersi silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this subject?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, `curriculum/${selectedExam}/subjects`, subjectId));
      await loadSubjects();
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert(language === 'tr' ? 'Ders silinirken hata oluştu' : 'Error deleting subject');
    }
  };

  // Batch Import/Export Functions
  const handleExportCurriculum = () => {
    try {
      const data = {
        examType: selectedExam,
        subjects: subjects,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedExam}-curriculum-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert(language === 'tr' ? 'Müfredat başarıyla dışa aktarıldı!' : 'Curriculum exported successfully!');
    } catch (error) {
      console.error('Error exporting curriculum:', error);
      alert(language === 'tr' ? 'Dışa aktarma başarısız!' : 'Export failed!');
    }
  };

  const handleImportCurriculum = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        if (!json.subjects || !Array.isArray(json.subjects)) {
          throw new Error('Invalid JSON format');
        }

        const confirmImport = confirm(
          language === 'tr' 
            ? `${json.subjects.length} ders içe aktarılacak. Devam etmek istiyor musunuz?`
            : `${json.subjects.length} subjects will be imported. Continue?`
        );

        if (!confirmImport) return;

        for (const subject of json.subjects) {
          // Add subject
          const subjectRef = await addDoc(
            collection(db, `curriculum/${selectedExam}/subjects`),
            {
              title: subject.title,
              description: subject.description || '',
              icon: subject.icon || '📘',
              color: subject.color || 'blue',
              order: subject.order,
              estimatedHours: subject.estimatedHours,
              totalTopics: subject.topics?.length || 0,
              examType: selectedExam,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          );

          // Add topics
          if (subject.topics && Array.isArray(subject.topics)) {
            for (const topic of subject.topics) {
              const topicRef = await addDoc(
                collection(db, `curriculum/${selectedExam}/subjects/${subjectRef.id}/topics`),
                {
                  name: topic.name || topic.title,
                  title: topic.title || topic.name,
                  order: topic.order,
                  estimatedHours: topic.estimatedHours || 0,
                  difficulty: topic.difficulty || 'medium',
                  subjectId: subjectRef.id,
                  createdAt: new Date().toISOString()
                }
              );

              // Add subtopics
              if (topic.subtopics && Array.isArray(topic.subtopics)) {
                for (let i = 0; i < topic.subtopics.length; i++) {
                  const subtopic = topic.subtopics[i];
                  const subtopicName = typeof subtopic === 'string' ? subtopic : subtopic.name || subtopic.title;
                  
                  await addDoc(
                    collection(db, `curriculum/${selectedExam}/subjects/${subjectRef.id}/topics/${topicRef.id}/subtopics`),
                    {
                      name: subtopicName,
                      title: subtopicName,
                      order: i + 1,
                      topicId: topicRef.id,
                      subjectId: subjectRef.id,
                      createdAt: new Date().toISOString()
                    }
                  );
                }
              }
            }
          }
        }

        alert(language === 'tr' ? 'Toplu müfredat başarıyla eklendi!' : 'Bulk curriculum imported successfully!');
        await loadSubjects();
      } catch (error) {
        console.error('Error importing curriculum:', error);
        alert(language === 'tr' ? 'İçe aktarma başarısız! JSON formatını kontrol edin.' : 'Import failed! Check JSON format.');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">
            <BilingualText text="Yükleniyor... – Loading..." />
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Exam Type Selector & Batch Operations */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant={selectedExam === 'tyt' ? 'default' : 'outline'}
            onClick={() => setSelectedExam('tyt')}
          >
            TYT
          </Button>
          <Button
            variant={selectedExam === 'ayt' ? 'default' : 'outline'}
            onClick={() => setSelectedExam('ayt')}
          >
            AYT
          </Button>
          <Button
            variant={selectedExam === 'yks' ? 'default' : 'outline'}
            onClick={() => setSelectedExam('yks')}
          >
            YKS
          </Button>
        </div>

        {/* Import/Export Buttons */}
        <div className="flex gap-2">
          <input
            type="file"
            accept=".json"
            onChange={handleImportCurriculum}
            className="hidden"
            id="bulk-import"
          />
          <label htmlFor="bulk-import">
            <Button variant="outline" size="sm" asChild>
              <span className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                <BilingualText text="İçe Aktar – Import" />
              </span>
            </Button>
          </label>
          
          <Button 
            onClick={handleExportCurriculum} 
            variant="outline" 
            size="sm"
            disabled={subjects.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            <BilingualText text="Dışa Aktar – Export" />
          </Button>
        </div>
      </div>

      {/* Add Subject Form */}
      {showSubjectForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              <BilingualText text="Yeni Ders Ekle – Add New Subject" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <BilingualText text="Ders Adı – Subject Name" />
                  </label>
                  <input
                    type="text"
                    value={newSubject.title}
                    onChange={(e) => setNewSubject({...newSubject, title: e.target.value})}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <BilingualText text="Sıra – Order" />
                  </label>
                  <input
                    type="number"
                    value={newSubject.order}
                    onChange={(e) => setNewSubject({...newSubject, order: parseInt(e.target.value)})}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  <BilingualText text="Açıklama – Description" />
                </label>
                <textarea
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({...newSubject, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  <BilingualText text="Ekle – Add" />
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowSubjectForm(false)}>
                  <BilingualText text="İptal – Cancel" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Subjects List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            <BilingualText text="Dersler – Subjects" />
          </h2>
          <Button onClick={() => setShowSubjectForm(!showSubjectForm)}>
            <Plus className="h-4 w-4 mr-2" />
            <BilingualText text="Ders Ekle – Add Subject" />
          </Button>
        </div>

        {subjects.map((subject) => (
          <Card key={subject.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{subject.icon || '📘'}</span>
                  <div>
                    <CardTitle>{subject.title}</CardTitle>
                    <CardDescription>{subject.description}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSubjectId(subject.id);
                      setShowTopicForm(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    <BilingualText text="Konu – Topic" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSubject(subject.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {subject.topics && subject.topics.length > 0 && (
                <div className="space-y-2 mt-4">
                  {subject.topics.map((topic) => (
                    <div key={topic.id} className="border-l-2 border-blue-200 pl-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600">•</span>
                          <span className="font-medium">{topic.name || topic.title}</span>
                          {topic.difficulty && (
                            <Badge variant="secondary" className="text-xs">
                              {topic.difficulty}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSubjectId(subject.id);
                              setSelectedTopicId(topic.id);
                              setShowSubtopicForm(true);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            <BilingualText text="Alt Konu – Subtopic" />
                          </Button>
                        </div>
                      </div>
                      {topic.subtopics && topic.subtopics.length > 0 && (
                        <div className="ml-6 mt-2 space-y-1">
                          {topic.subtopics.map((subtopic) => (
                            <div key={subtopic.id} className="text-sm text-gray-600">
                              › {subtopic.name || subtopic.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {subjects.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                <BilingualText 
                  text="Henüz ders eklenmemiş – No subjects added yet"
                />
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Topic Form */}
      {showTopicForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              <BilingualText text="Yeni Konu Ekle – Add New Topic" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTopic} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  <BilingualText text="Konu Adı – Topic Name" />
                </label>
                <input
                  type="text"
                  value={newTopic.name}
                  onChange={(e) => setNewTopic({...newTopic, name: e.target.value})}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  <BilingualText text="Ekle – Add" />
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowTopicForm(false);
                  setSelectedSubjectId('');
                }}>
                  <BilingualText text="İptal – Cancel" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Add Subtopic Form */}
      {showSubtopicForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              <BilingualText text="Yeni Alt Konu Ekle – Add New Subtopic" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddSubtopic} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  <BilingualText text="Alt Konu Adı – Subtopic Name" />
                </label>
                <input
                  type="text"
                  value={newSubtopic.name}
                  onChange={(e) => setNewSubtopic({...newSubtopic, name: e.target.value})}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  <BilingualText text="Ekle – Add" />
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowSubtopicForm(false);
                  setSelectedSubjectId('');
                  setSelectedTopicId('');
                }}>
                  <BilingualText text="İptal – Cancel" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
