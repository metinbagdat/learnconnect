import { useState } from 'react';
import { generateExam, publishExam } from '@/lib/curriculumControlApi';
import { Button } from '@/components/ui/button';

type Props = {
  ksdtTableId: string | null;
  onDone?: (examId: string) => void;
};

/**
 * Triggers server-side exam generation from KSDT constraints (not random trivia).
 */
export default function ExamGenerator({ ksdtTableId, onDone }: Props) {
  const [busy, setBusy] = useState(false);
  const [lastExamId, setLastExamId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    if (!ksdtTableId) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await generateExam(ksdtTableId);
      setLastExamId(res.examId);
      setMessage(`Draft exam ${res.examId} — ${res.questionCount} question(s).`);
      onDone?.(res.examId);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!lastExamId) return;
    setBusy(true);
    try {
      await publishExam(lastExamId);
      setMessage(`Published exam ${lastExamId}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button className="w-full" disabled={!ksdtTableId || busy} type="button" onClick={run}>
        {busy ? 'Generating…' : 'Generate draft exam (AI / placeholder)'}
      </Button>
      {lastExamId && (
        <Button variant="secondary" className="w-full" type="button" disabled={busy} onClick={publish}>
          Publish last draft
        </Button>
      )}
      {message && <p className="text-xs text-muted-foreground break-all">{message}</p>}
    </div>
  );
}
