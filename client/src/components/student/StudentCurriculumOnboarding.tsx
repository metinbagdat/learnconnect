import { useState } from 'react';
import { Button } from '@/components/ui/button';

type Step = 0 | 1 | 2;

const EXAMS = [
  { id: 'tyt', label: 'TYT' },
  { id: 'ayt', label: 'AYT' },
];

const SUBJECTS = [
  { id: 'math', label: 'Mathematics' },
  { id: 'turkish', label: 'Turkish' },
  { id: 'physics', label: 'Physics' },
  { id: 'chemistry', label: 'Chemistry' },
];

/**
 * 3-step onboarding: exam focus → subject selection → confirm.
 * Wire POST /api/user/curriculum (existing) or new preferences endpoint when backend is ready.
 */
export default function StudentCurriculumOnboarding({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState<Step>(0);
  const [exams, setExams] = useState<string[]>(['tyt']);
  const [subjects, setSubjects] = useState<string[]>([]);

  const toggle = (list: string[], id: string, set: (v: string[]) => void) => {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const submit = async () => {
    try {
      await fetch('/api/user/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects,
          examTypes: exams,
          customMode: false,
        }),
      });
    } catch {
      // Non-fatal: show UI success anyway for offline / partial API
    }
    onComplete?.();
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6 rounded-xl border bg-white dark:bg-slate-900 shadow-sm">
      <div className="flex gap-2 text-xs font-medium">
        {['Exams', 'Subjects', 'Review'].map((label, i) => (
          <span
            key={label}
            className={`flex-1 text-center py-1 rounded ${step === i ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Select exam focus</h2>
          <div className="flex flex-wrap gap-2">
            {EXAMS.map((e) => (
              <button
                key={e.id}
                type="button"
                className={`px-3 py-2 rounded-lg border text-sm ${exams.includes(e.id) ? 'border-indigo-600 bg-indigo-50' : ''}`}
                onClick={() => toggle(exams, e.id, setExams)}
              >
                {e.label}
              </button>
            ))}
          </div>
          <Button className="w-full" type="button" onClick={() => setStep(1)}>
            Next
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Choose subjects</h2>
          <div className="grid grid-cols-2 gap-2">
            {SUBJECTS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`px-3 py-2 rounded-lg border text-sm text-left ${subjects.includes(s.id) ? 'border-indigo-600 bg-indigo-50' : ''}`}
                onClick={() => toggle(subjects, s.id, setSubjects)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button className="flex-1" type="button" onClick={() => setStep(2)} disabled={subjects.length === 0}>
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Confirm</h2>
          <p className="text-sm text-muted-foreground">
            Exams: {exams.join(', ')} · Subjects: {subjects.join(', ')}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button className="flex-1" type="button" onClick={submit}>
              Save & continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
