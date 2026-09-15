import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AuthGuard from "@/components/auth/AuthGuard";
import ModernNavigation from "@/components/layout/modern-navigation";
import { useLanguage } from "@/contexts/consolidated-language-context";

const TOTAL_MINUTES = 75;
const QUESTION_COUNT = 10;

// Demo questions - TYT format
const DEMO_QUESTIONS = [
  { id: 1, subject: "Matematik", text: "2x + 5 = 15 ise x kaçtır?", options: ["3", "4", "5", "6"], correct: 2 },
  { id: 2, subject: "Türkçe", text: "Aşağıdakilerden hangisi birleşik zamanlı fiildir?", options: ["geliyor", "gelmişti", "geldi", "gelecek"], correct: 1 },
  { id: 3, subject: "Fen", text: "Işık hangi ortamda en hızlı ilerler?", options: ["Su", "Hava", "Cam", "Boşluk"], correct: 3 },
  { id: 4, subject: "Sosyal", text: "Türkiye'nin başkenti neresidir?", options: ["İzmir", "Ankara", "İstanbul", "Bursa"], correct: 1 },
  { id: 5, subject: "Matematik", text: "√81 kaçtır?", options: ["7", "8", "9", "10"], correct: 2 },
  { id: 6, subject: "Türkçe", text: "Hangi kelime büyük ünlü uyumuna uyar?", options: ["kalem", "telefon", "kitap", "defter"], correct: 0 },
  { id: 7, subject: "Fen", text: "DNA'nın yapısı nasıldır?", options: ["Tek zincir", "Çift sarmal", "Üçlü sarmal", "Dörtlü"], correct: 1 },
  { id: 8, subject: "Sosyal", text: "Kurtuluş Savaşı hangi yıl başlamıştır?", options: ["1918", "1919", "1920", "1921"], correct: 1 },
  { id: 9, subject: "Matematik", text: "15'in %20'si kaçtır?", options: ["2", "3", "4", "5"], correct: 1 },
  { id: 10, subject: "Türkçe", text: "Aşağıdakilerden hangisi öznel bir yargıdır?", options: ["Dünya Güneş etrafında döner", " Bu kitap çok güzel", "Su 100°C'de kaynar", "Ankara Türkiye'dedir"], correct: 1 },
];

export default function DenemeSinaviPage() {
  const { language } = useLanguage();
  const [phase, setPhase] = useState<"ready" | "exam" | "result">("ready");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(TOTAL_MINUTES * 60);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (phase !== "exam" || !startTime) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const left = TOTAL_MINUTES * 60 - elapsed;
      setTimeLeft(Math.max(0, left));
      if (left <= 0) {
        setPhase("result");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, startTime]);

  const handleStart = () => {
    setPhase("exam");
    setStartTime(Date.now());
  };

  const handleAnswer = (questionIndex: number, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleFinish = () => {
    setPhase("result");
  };

  const correctCount = DEMO_QUESTIONS.filter((q, i) => answers[i] === q.correct).length;
  const wrongCount = Object.keys(answers).length - correctCount;
  const emptyCount = QUESTION_COUNT - Object.keys(answers).length;
  const netScore = correctCount - wrongCount / 4;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLast5Min = timeLeft <= 300;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950">
        <ModernNavigation
          pageTitle={language === "tr" ? "Zamanlı Deneme Sınavı" : "Timed Practice Exam"}
          currentPage="deneme"
        />
        <div className="max-w-4xl mx-auto p-6">
          <AnimatePresence mode="wait">
            {phase === "ready" && (
              <motion.div
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">
                      {language === "tr" ? "TYT Deneme Sınavı" : "TYT Practice Exam"}
                    </CardTitle>
                    <p className="text-muted-foreground">
                      {QUESTION_COUNT} soru • {TOTAL_MINUTES} dakika
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Button size="lg" onClick={handleStart}>
                      {language === "tr" ? "Sınavı Başlat" : "Start Exam"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {phase === "exam" && (
              <motion.div
                key="exam"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Timer */}
                <div
                  className={`flex items-center justify-center gap-2 py-3 rounded-lg mb-6 ${
                    isLast5Min ? "bg-red-100 text-red-700 dark:bg-red-950" : "bg-white dark:bg-slate-800"
                  }`}
                >
                  <Clock className="h-6 w-6" />
                  <span className="text-2xl font-mono font-bold">
                    {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                  </span>
                </div>

                {/* Question */}
                <Card>
                  <CardHeader className="flex flex-row justify-between">
                    <span className="text-sm text-muted-foreground">
                      Soru {currentIndex + 1} / {QUESTION_COUNT}
                    </span>
                    <span className="text-sm font-medium">
                      {DEMO_QUESTIONS[currentIndex].subject}
                    </span>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg mb-6">{DEMO_QUESTIONS[currentIndex].text}</p>
                    <div className="space-y-2">
                      {DEMO_QUESTIONS[currentIndex].options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleAnswer(currentIndex, i)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition ${
                            answers[currentIndex] === i
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}) {opt}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Önceki
                  </Button>
                  <div className="flex gap-1 flex-wrap justify-center max-w-md">
                    {DEMO_QUESTIONS.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`w-8 h-8 rounded-full text-sm font-medium ${
                          answers[i] !== undefined
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <Button
                    onClick={() =>
                      currentIndex === QUESTION_COUNT - 1
                        ? handleFinish()
                        : setCurrentIndex((i) => i + 1)
                    }
                  >
                    {currentIndex === QUESTION_COUNT - 1 ? (
                      "Bitir"
                    ) : (
                      <>
                        Sonraki <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {phase === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{language === "tr" ? "Sonuç" : "Result"}</CardTitle>
                    <p className="text-3xl font-bold text-blue-600">{netScore.toFixed(2)} Net</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Doğru: {correctCount}</span>
                      </div>
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-5 w-5" />
                        <span>Yanlış: {wrongCount}</span>
                      </div>
                      <div className="text-muted-foreground">Boş: {emptyCount}</div>
                    </div>
                    <div className="border-t pt-4">
                      <p className="font-medium mb-2">Cevaplar</p>
                      <div className="grid grid-cols-5 gap-2">
                        {DEMO_QUESTIONS.map((q, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded text-center text-sm ${
                              answers[i] === q.correct
                                ? "bg-green-100 text-green-800"
                                : answers[i] !== undefined
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100"
                            }`}
                          >
                            {i + 1}: {answers[i] === q.correct ? "✓" : answers[i] !== undefined ? "✗" : "-"}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      Tekrar Dene
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AuthGuard>
  );
}
