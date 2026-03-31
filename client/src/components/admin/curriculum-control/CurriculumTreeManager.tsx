import { useCallback, useMemo, useState } from 'react';
import {
  createCurriculumNode,
  deleteCurriculumNode,
  patchCurriculumNode,
  type CurriculumNode,
} from '@/lib/curriculumControlApi';
import { Button } from '@/components/ui/button';
import { ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';

type Props = {
  nodes: CurriculumNode[];
  examCategoryId: string | null;
  onRefresh: () => void;
};

function buildTree(flat: CurriculumNode[], parentId: string | null = null): CurriculumNode[] {
  return flat
    .filter((n) => (n.parent_id || null) === parentId)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((n) => ({ ...n, children: buildTree(flat, n.id) })) as (CurriculumNode & { children?: CurriculumNode[] })[];
}

export default function CurriculumTreeManager({ nodes, examCategoryId, onRefresh }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [addingFor, setAddingFor] = useState<string | null>(null);

  const tree = useMemo(() => buildTree(nodes, null), [nodes]);

  const learningObjectives = useMemo(
    () => nodes.filter((n) => n.type === 'learning_objective'),
    [nodes],
  );

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveName = async (id: string) => {
    await patchCurriculumNode({ id, name: draftName });
    setEditingId(null);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this node and all descendants?')) return;
    await deleteCurriculumNode(id);
    onRefresh();
  };

  const handleAddChild = useCallback(
    async (parentId: string | null, type: string) => {
      const code = window.prompt('Objective / node code (e.g. F.8.4.3.1)') || '';
      const name = window.prompt('Display name') || '';
      if (!code.trim() || !name.trim()) return;
      await createCurriculumNode({
        code: code.trim(),
        name: name.trim(),
        type,
        parentId,
        examCategoryId,
        sortOrder: nodes.filter((n) => (n.parent_id || null) === parentId).length,
      });
      setAddingFor(null);
      onRefresh();
    },
    [examCategoryId, nodes, onRefresh],
  );

  const renderNode = (node: CurriculumNode & { children?: CurriculumNode[] }, depth: number) => {
    const hasChildren = (node.children?.length ?? 0) > 0;
    const open = expanded[node.id] ?? depth < 2;

    return (
      <div key={node.id} className="select-none">
        <div
          className="flex items-center gap-1 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          style={{ paddingLeft: depth * 12 }}
        >
          {hasChildren ? (
            <button type="button" className="p-0.5" onClick={() => toggle(node.id)} aria-label="Toggle">
              <ChevronRight className={`h-4 w-4 transition ${open ? 'rotate-90' : ''}`} />
            </button>
          ) : (
            <span className="w-5" />
          )}
          <span className="font-mono text-xs text-slate-500 w-28 shrink-0 truncate">{node.code}</span>
          {editingId === node.id ? (
            <>
              <input
                className="flex-1 border rounded px-2 py-0.5 text-sm bg-white dark:bg-slate-900"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName(node.id)}
              />
              <Button size="sm" variant="secondary" onClick={() => handleSaveName(node.id)}>
                Save
              </Button>
            </>
          ) : (
            <>
              <span className="flex-1 text-sm font-medium truncate">{node.name}</span>
              <span className="text-[10px] uppercase text-slate-400">{node.type.replace('_', ' ')}</span>
              <button
                type="button"
                className="p-1 rounded opacity-70 hover:opacity-100"
                onClick={() => {
                  setEditingId(node.id);
                  setDraftName(node.name);
                }}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button type="button" className="p-1 rounded text-red-600" onClick={() => handleDelete(node.id)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
        {node.type === 'learning_objective' && (
          <div className="text-xs text-slate-500 pl-10 pb-1">
            Difficulty {node.difficulty}/5 · Prerequisites {(node.prerequisites || []).length}
          </div>
        )}
        {open && node.children?.map((ch) => renderNode(ch as CurriculumNode & { children?: CurriculumNode[] }, depth + 1))}
        {open && addingFor === node.id && (
          <div className="pl-8 py-2 flex flex-wrap gap-2">
            {(['unit', 'topic', 'subtopic', 'learning_objective'] as const).map((t) => (
              <Button key={t} size="sm" variant="outline" onClick={() => handleAddChild(node.id, t)}>
                + {t}
              </Button>
            ))}
          </div>
        )}
        {open && (
          <div className="pl-8">
            <button
              type="button"
              className="text-xs text-blue-600 flex items-center gap-1 py-1"
              onClick={() => setAddingFor(addingFor === node.id ? null : node.id)}
            >
              <Plus className="h-3 w-3" /> Add child
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => handleAddChild(null, 'subject')}>
          + Subject (root)
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Tree CRUD for curriculum codes. Reparenting: use a DB admin tool or extend API with bulk move; drag-and-drop can
        be layered with @dnd-kit on this list.
      </p>
      <div className="border rounded-lg p-3 bg-white/80 dark:bg-slate-900/60 max-h-[60vh] overflow-auto">
        {tree.length === 0 ? (
          <p className="text-sm text-muted-foreground">No nodes for this category. Add a subject or seed data.</p>
        ) : (
          tree.map((n) => renderNode(n as CurriculumNode & { children?: CurriculumNode[] }, 0))
        )}
      </div>
      {learningObjectives.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {learningObjectives.length} learning objective(s) available for KSDT rows.
        </div>
      )}
    </div>
  );
}
