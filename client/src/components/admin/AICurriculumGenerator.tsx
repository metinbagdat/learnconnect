import { useState } from 'react';
import { generateCurriculum, type GeneratedSubject } from '@/services/aiCurriculumService';
import { BilingualText } from '@/components/ui/bilingual-text';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/consolidated-language-context';
import { 
  collection, 
  addDoc, 
  collection as getCollection,
  doc as getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Brain, Sparkles, CheckCircle2 } from 'lucide-react';

type ExamType = 'tyt' | 'ayt' | 'yks';

export default function AICurriculumGenerator() {
  const { language } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedSubject[] | null>(null);
  const [error, setError] = useState('');
  const [selectedExam, setSelectedExam] = useState<ExamType>('tyt');
  const [saving, setSaving] = useState(false);

  const predefinedPrompts = [
    {
      label: language === 'tr' ? 'TYT Matematik Full Müfredat' : 'TYT Mathematics Full Curriculum',
      value: language === 'tr' 
        ? 'TYT Matematik için tüm konuları ve alt konuları oluştur. Her konu için tahmini çalışma saati, zorluk seviyesi ve bağlantılı konuları belirt.'
        : 'Create all topics and subtopics for TYT Mathematics. Specify estimated study hours, difficulty level, and related topics for each topic.'
    },
    {
      label: language === 'tr' ? 'TYT Türkçe Konu Ağacı' : 'TYT Turkish Topic Tree',
      value: language === 'tr'
        ? 'TYT Türkçe dersi için detaylı konu ağacı oluştur. Paragraf, dil bilgisi, anlatım bozukluğu gibi ana başlıklar altında tüm alt konuları listele.'
        : 'Create a detailed topic tree for TYT Turkish. List all subtopics under main headings such as paragraph, grammar, and expression errors.'
    },
    {
      label: language === 'tr' ? 'AYT Fizik Müfredatı' : 'AYT Physics Curriculum',
      value: language === 'tr'
        ? 'AYT Fizik dersinin tüm konularını, konular arasındaki öncelik sırasını ve her konunun tahmini çalışma süresini içeren bir müfredat oluştur.'
        : 'Create a curriculum for AYT Physics that includes all topics, priority order between topics, and estimated study time for each topic.'
    }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError(language === 'tr' ? 'Lütfen bir prompt girin' : 'Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedData(null);
    
    try {
      const result = await generateCurriculum(prompt, selectedExam);
      
      if (result.success && result.data) {
        setGeneratedData(result.data);
      } else {
        setError(result.error || (language === 'tr' ? 'AI yanıtı oluşturulamadı' : 'Failed to generate AI response'));
      }
    } catch (err) {
      setError(language === 'tr' ? 'AI servisine bağlanılamadı' : 'Could not connect to AI service');
      console.error('AI Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!generatedData || generatedData.length === 0) return;

    setSaving(true);
    try {
      for (const subject of generatedData) {
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
            totalTopics: subject.topics.length,
            examType: selectedExam,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        );

        // Add topics
        for (const topic of subject.topics) {
          const topicRef = await addDoc(
            collection(db, `curriculum/${selectedExam}/subjects/${subjectRef.id}/topics`),
            {
              name: topic.title,
              title: topic.title,
              order: topic.order,
              estimatedHours: topic.estimatedHours || 0,
              difficulty: topic.difficulty || 'medium',
              subjectId: subjectRef.id,
              createdAt: new Date().toISOString()
            }
          );

          // Add subtopics
          for (let i = 0; i < topic.subtopics.length; i++) {
            const subtopicName = topic.subtopics[i];
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

      alert(language === 'tr' 
        ? 'Müfredat başarıyla Firestore\'a kaydedildi!' 
        : 'Curriculum successfully saved to Firestore!'
      );
      setGeneratedData(null);
      setPrompt('');
    } catch (error) {
      console.error('Error saving curriculum:', error);
      alert(language === 'tr' 
        ? 'Müfredat kaydedilirken hata oluştu' 
        : 'Error saving curriculum'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <BilingualText text="AI ile Müfredat Oluştur – Generate Curriculum with AI" />
          </CardTitle>
          <CardDescription>
            <BilingualText 
              text="AI kullanarak otomatik müfredat oluşturun – Automatically generate curriculum using AI"
            />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Exam Type Selector */}
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

          {/* Predefined Prompts */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <BilingualText text="Hızlı Şablonlar – Quick Templates" />
            </label>
            <div className="flex flex-wrap gap-2">
              {predefinedPrompts.map((predefined, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPrompt(predefined.value)}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {predefined.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <BilingualText text="Özel Prompt – Custom Prompt" />
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={language === 'tr' 
                ? "Örn: 'TYT Geometri konularını oluştur'"
                : "E.g.: 'Create TYT Geometry topics'"
              }
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate} 
            disabled={loading || !prompt.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <BilingualText text="Oluşturuluyor... – Generating..." />
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                <BilingualText text="Müfredat Oluştur – Generate Curriculum" />
              </>
            )}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Generated Preview */}
          {generatedData && generatedData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <BilingualText text="Oluşturulan Müfredat – Generated Curriculum" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {generatedData.map((subject, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{subject.icon || '📘'}</span>
                        <h4 className="font-semibold">{subject.title}</h4>
                        <Badge variant="secondary">{subject.topics.length} topics</Badge>
                      </div>
                      {subject.description && (
                        <p className="text-sm text-muted-foreground mb-2">{subject.description}</p>
                      )}
                      <div className="space-y-1">
                        {subject.topics.slice(0, 3).map((topic, topicIndex) => (
                          <div key={topicIndex} className="text-sm ml-4">
                            • {topic.title} ({topic.subtopics.length} subtopics)
                          </div>
                        ))}
                        {subject.topics.length > 3 && (
                          <div className="text-sm ml-4 text-muted-foreground">
                            ... ve {subject.topics.length - 3} konu daha
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    onClick={handleApply} 
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        <BilingualText text="Kaydediliyor... – Saving..." />
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        <BilingualText text="Firestore'a Kaydet – Save to Firestore" />
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setGeneratedData(null);
                      setPrompt('');
                    }}
                  >
                    <BilingualText text="İptal – Cancel" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
