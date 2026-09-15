import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import {
  createExamCategory,
  createKsdtTable,
  type CurriculumNode,
} from '@/lib/curriculumControlApi';
import { useCurriculumControl } from '@/hooks/useCurriculumControl';
import CurriculumTreeManager from './CurriculumTreeManager';
import KSDTBuilder from './KSDTBuilder';
import ActionPanel from './ActionPanel';
import { Button } from '@/components/ui/button';

/**
 * Admin "Curriculum Control Center": tree (data) → KSDT (constraints) → AI exam → reports.
 */
export default function CurriculumControlCenter() {
  const {
    categories,
    loadCategories,
    nodes,
    loadTree,
    tables,
    loadKsdtTables,
    error,
    setError,
  } = useCurriculumControl();

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selectedKsdtId, setSelectedKsdtId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadTree(categoryId);
  }, [categoryId, loadTree, refreshKey]);

  useEffect(() => {
    loadKsdtTables();
  }, [loadKsdtTables, refreshKey]);

  const learningObjectives = useMemo(
    () => nodes.filter((n: CurriculumNode) => n.type === 'learning_objective'),
    [nodes],
  );

  const refresh = () => setRefreshKey((k) => k + 1);

  const addLearningObjectiveQuick = async () => {
    const code = window.prompt('Code (e.g. F.8.4.3.1)') || '';
    const name = window.prompt('Name') || '';
    if (!code.trim() || !name.trim()) return;
    const { createCurriculumNode } = await import('@/lib/curriculumControlApi');
    await createCurriculumNode({
      code: code.trim(),
      name: name.trim(),
      type: 'learning_objective',
      parentId: null,
      examCategoryId: categoryId,
    });
    refresh();
  };

  const createKsdt = async () => {
    const name = window.prompt('KSDT table name (e.g. Grade 8 Science — Exam 1)') || '';
    if (!name.trim()) return;
    const { table } = await createKsdtTable({ name: name.trim(), examCategoryId: categoryId });
    setSelectedKsdtId(table.id);
    refresh();
  };

  const createCategory = async () => {
    const slug = window.prompt('Category slug (e.g. tyt-math)') || '';
    const name = window.prompt('Display name (e.g. TYT Mathematics)') || '';
    if (!slug.trim() || !name.trim()) return;
    try {
      const { category } = await createExamCategory({
        slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
        name: name.trim(),
        examType: 'tyt',
      });
      setCategoryId(category.id);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create category');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900">
      <header className="border-b bg-white/90 dark:bg-slate-950/90 backdrop-blur px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/admin" className="hover:underline">
              ← Admin
            </Link>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Curriculum & exam system</h1>
          <p className="text-xs text-muted-foreground max-w-xl">
            Manage → measure → adapt: curriculum tree and KSDT drive AI exam generation (not a generic quiz bank).
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            className="border rounded-md px-2 py-1.5 text-sm bg-white dark:bg-slate-900"
            value={categoryId || ''}
            onChange={(e) => setCategoryId(e.target.value || null)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button size="sm" variant="outline" type="button" onClick={createCategory}>
            + Exam category
          </Button>
          <Button size="sm" variant="secondary" type="button" onClick={addLearningObjectiveQuick}>
            + Learning objective
          </Button>
          <Button size="sm" variant="secondary" type="button" onClick={createKsdt}>
            + KSDT table
          </Button>
        </div>
      </header>

      {categories.length === 0 && (
        <div className="mx-4 mt-2 text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 rounded-md border border-amber-200 dark:border-amber-800">
          No exam categories yet. Create one (TYT/AYT/MEB bucket) so the curriculum tree can be scoped, then add nodes or
          run <code className="text-xs">npm run seed:curriculum-control</code> on the server with Supabase env.
        </div>
      )}

      {error && (
        <div className="mx-4 mt-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded-md flex justify-between gap-2">
          <span>{error}</span>
          <button type="button" className="underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <aside className="lg:w-[32%] border-r bg-white/60 dark:bg-slate-950/40 p-4 overflow-auto">
          <h2 className="text-sm font-semibold mb-2">Curriculum tree</h2>
          <CurriculumTreeManager nodes={nodes} examCategoryId={categoryId} onRefresh={refresh} />
        </aside>

        <main className="lg:w-[36%] border-r bg-white/40 dark:bg-slate-950/20 p-4 overflow-auto">
          <h2 className="text-sm font-semibold mb-2">KSDT builder</h2>
          <div className="mb-3">
            <label className="text-xs text-muted-foreground block mb-1">Active KSDT</label>
            <select
              className="w-full border rounded-md px-2 py-2 text-sm bg-white dark:bg-slate-900"
              value={selectedKsdtId || ''}
              onChange={(e) => setSelectedKsdtId(e.target.value || null)}
            >
              <option value="">Select table</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <KSDTBuilder
            selectedKsdtId={selectedKsdtId}
            learningObjectives={learningObjectives}
            onRefreshTables={refresh}
          />
        </main>

        <aside className="lg:w-[32%] p-4 overflow-auto">
          <h2 className="text-sm font-semibold mb-2">Actions & pipeline</h2>
          <ActionPanel ksdtTableId={selectedKsdtId} onRegenerate={refresh} />
        </aside>
      </div>
    </div>
  );
}
