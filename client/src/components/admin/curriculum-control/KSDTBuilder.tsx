import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  createKsdtRow,
  deleteKsdtRow,
  fetchKsdtRows,
  patchKsdtRow,
  type CurriculumNode,
  type KsdtRow,
} from '@/lib/curriculumControlApi';
import { Button } from '@/components/ui/button';

type Props = {
  selectedKsdtId: string | null;
  learningObjectives: CurriculumNode[];
  onRefreshTables: () => void;
};

function SortableRow({
  row,
  los,
  onChangeCount,
  onChangeDifficulty,
  onChangeObjective,
  onRemove,
}: {
  row: KsdtRow;
  los: CurriculumNode[];
  onChangeCount: (id: string, n: number) => void;
  onChangeDifficulty: (id: string, d: string) => void;
  onChangeObjective: (id: string, loId: string) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border bg-slate-50 dark:bg-slate-900/50 p-3 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          className="cursor-grab touch-none px-1 text-slate-400"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          ⋮⋮
        </button>
        <select
          className="flex-1 text-sm border rounded px-2 py-1 bg-white dark:bg-slate-950"
          value={row.learning_objective_id || ''}
          onChange={(e) => onChangeObjective(row.id, e.target.value)}
        >
          <option value="">Select learning objective</option>
          {los.map((lo) => (
            <option key={lo.id} value={lo.id}>
              {lo.code} — {lo.name}
            </option>
          ))}
        </select>
        <Button size="sm" variant="destructive" type="button" onClick={() => onRemove(row.id)}>
          Remove
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs flex flex-col gap-1">
          Questions: {row.question_count}
          <input
            type="range"
            min={1}
            max={12}
            value={row.question_count}
            onChange={(e) => onChangeCount(row.id, Number(e.target.value))}
            className="w-full"
          />
        </label>
        <label className="text-xs flex flex-col gap-1">
          Difficulty
          <select
            className="border rounded px-2 py-1 text-sm bg-white dark:bg-slate-950"
            value={row.difficulty}
            onChange={(e) => onChangeDifficulty(row.id, e.target.value)}
          >
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export default function KSDTBuilder({ selectedKsdtId, learningObjectives, onRefreshTables }: Props) {
  const [rows, setRows] = useState<KsdtRow[]>([]);
  const [loading, setLoading] = useState(false);

  const los = useMemo(() => learningObjectives, [learningObjectives]);

  const loadRows = async () => {
    if (!selectedKsdtId) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const { rows: r } = await fetchKsdtRows(selectedKsdtId);
      setRows(r || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when table changes
  }, [selectedKsdtId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((r) => r.id === active.id);
    const newIndex = rows.findIndex((r) => r.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(rows, oldIndex, newIndex).map((r, i) => ({ ...r, sort_order: i }));
    setRows(next);
    await Promise.all(next.map((r) => patchKsdtRow({ id: r.id, sortOrder: r.sort_order })));
    onRefreshTables();
  };

  const addRow = async () => {
    if (!selectedKsdtId) return;
    const firstLo = los[0]?.id || null;
    await createKsdtRow({
      ksdtTableId: selectedKsdtId,
      learningObjectiveId: firstLo,
      questionCount: 2,
      difficulty: 'medium',
    });
    await loadRows();
    onRefreshTables();
  };

  const updateCount = async (id: string, n: number) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, question_count: n } : r)));
    await patchKsdtRow({ id, questionCount: n });
  };

  const updateDifficulty = async (id: string, d: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, difficulty: d } : r)));
    await patchKsdtRow({ id, difficulty: d });
  };

  const updateObjective = async (id: string, loId: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, learning_objective_id: loId || null, learning_objective: los.find((l) => l.id === loId) || null } : r,
      ),
    );
    await patchKsdtRow({ id, learningObjectiveId: loId || null });
  };

  const remove = async (id: string) => {
    await deleteKsdtRow(id);
    await loadRows();
    onRefreshTables();
  };

  const totalQuestions = rows.reduce((acc, r) => acc + (r.question_count || 0), 0);
  const coverage = new Set(rows.map((r) => r.learning_objective_id).filter(Boolean)).size;

  if (!selectedKsdtId) {
    return <p className="text-sm text-muted-foreground">Select or create a KSDT table in the header actions.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <div className="text-sm">
          <span className="font-semibold">{totalQuestions}</span> questions ·{' '}
          <span className="font-semibold">{coverage}</span> objectives
        </div>
        <Button size="sm" type="button" onClick={addRow} disabled={loading}>
          + Add objective row
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading rows…</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {rows.map((row) => (
                <SortableRow
                  key={row.id}
                  row={row}
                  los={los}
                  onChangeCount={updateCount}
                  onChangeDifficulty={updateDifficulty}
                  onChangeObjective={updateObjective}
                  onRemove={remove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
