import React, { useEffect, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";

export type PlanTask = {
  id: string;
  title: string;
  duration: number;
  type: string;
  completed: boolean;
};

type Props = {
  tasks: PlanTask[];
  onToggle: (id: string, completed: boolean) => void;
  onMarkAllComplete: () => void;
};

export default function TodayPlanCard({
  tasks,
  onToggle,
  onMarkAllComplete,
}: Props) {
  const [local, setLocal] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const t of tasks) next[t.id] = t.completed;
    setLocal(next);
  }, [tasks]);

  const anyUnchecked = tasks.some((t) => !(local[t.id] ?? t.completed));

  return (
    <div className="rounded-2xl bg-slate-800/60 border border-slate-700/80 p-4">
      <h3 className="text-sm font-semibold text-slate-100 mb-3">
        Bugünün planı
      </h3>
      <ul className="space-y-3">
        {tasks.length === 0 && (
          <li className="text-sm text-slate-500">Henüz görev yok. AI üretiyor…</li>
        )}
        {tasks.map((t) => {
          const done = local[t.id] ?? t.completed;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => {
                  const next = !done;
                  setLocal((s) => ({ ...s, [t.id]: next }));
                  onToggle(t.id, next);
                }}
                className="flex items-start gap-3 w-full text-left group"
              >
                <span className="mt-0.5 text-emerald-400">
                  {done ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500 group-hover:text-slate-300" />
                  )}
                </span>
                <span
                  className={`flex-1 text-sm leading-snug ${
                    done
                      ? "text-slate-500 line-through decoration-slate-500"
                      : "text-slate-100"
                  }`}
                >
                  {t.title}
                  <span className="block text-xs text-slate-500 mt-0.5">
                    {t.duration} dk · {t.type}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        disabled={!anyUnchecked || tasks.length === 0}
        onClick={() => {
          const next: Record<string, boolean> = {};
          for (const t of tasks) next[t.id] = true;
          setLocal(next);
          onMarkAllComplete();
        }}
        className="mt-4 w-full py-3 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition"
      >
        TAMAMLADIM
      </button>
    </div>
  );
}
