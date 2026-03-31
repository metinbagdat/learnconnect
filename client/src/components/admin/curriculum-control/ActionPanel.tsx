import { useEffect, useState } from 'react';
import { listExams } from '@/lib/curriculumControlApi';
import ExamGenerator from './ExamGenerator';
import { Button } from '@/components/ui/button';

type Props = {
  ksdtTableId: string | null;
  onRegenerate?: () => void;
};

export default function ActionPanel({ ksdtTableId, onRegenerate }: Props) {
  const [drafts, setDrafts] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    listExams('draft')
      .then((r) => setDrafts((r.exams || []).map((e) => ({ id: e.id, title: e.title }))))
      .catch(() => setDrafts([]));
  }, [ksdtTableId]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-white dark:bg-slate-900/80 p-4 shadow-sm">
        <h3 className="font-semibold text-sm mb-2">AI actions</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Questions are generated from KSDT rows (counts, difficulty, objective codes) — not unconstrained trivia.
        </p>
        <ExamGenerator ksdtTableId={ksdtTableId} />
        <Button variant="outline" className="w-full mt-2" type="button" onClick={() => onRegenerate?.()}>
          Refresh data
        </Button>
      </section>

      <section className="rounded-xl border bg-white dark:bg-slate-900/80 p-4 shadow-sm">
        <h3 className="font-semibold text-sm mb-2">Draft exams</h3>
        {drafts.length === 0 ? (
          <p className="text-xs text-muted-foreground">No drafts yet.</p>
        ) : (
          <ul className="text-xs space-y-1 max-h-32 overflow-auto">
            {drafts.map((d) => (
              <li key={d.id} className="truncate font-mono">
                {d.title}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border bg-white dark:bg-slate-900/80 p-4 shadow-sm">
        <h3 className="font-semibold text-sm mb-2">Export</h3>
        <p className="text-xs text-muted-foreground mb-2">
          PDF pipeline: call <code className="text-[10px]">POST /api/report/generate</code> or Edge{' '}
          <code className="text-[10px]">generate-report</code>.
        </p>
        <Button
          variant="secondary"
          className="w-full"
          type="button"
          onClick={() =>
            fetch('/api/report/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ format: 'json' }),
            })
              .then((r) => r.json())
              .then((j) => alert(JSON.stringify(j, null, 2)))
              .catch(() => alert('Report request failed'))
          }
        >
          Preview JSON report shell
        </Button>
      </section>
    </div>
  );
}
