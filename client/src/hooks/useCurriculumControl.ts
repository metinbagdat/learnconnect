import { useCallback, useState } from 'react';
import {
  fetchCurriculumTree,
  fetchExamCategories,
  fetchKsdtRows,
  fetchKsdtTables,
  type CurriculumNode,
  type ExamCategory,
  type KsdtRow,
  type KsdtTable,
} from '@/lib/curriculumControlApi';

export function useCurriculumControl() {
  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [nodes, setNodes] = useState<CurriculumNode[]>([]);
  const [tables, setTables] = useState<KsdtTable[]>([]);
  const [rows, setRows] = useState<KsdtRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { categories: c } = await fetchExamCategories();
      setCategories(c || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTree = useCallback(async (examCategoryId?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const { nodes: n } = await fetchCurriculumTree(examCategoryId || undefined);
      setNodes(n || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tree');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadKsdtTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { tables: t } = await fetchKsdtTables();
      setTables(t || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load KSDT tables');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadKsdtRows = useCallback(async (tableId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { rows: r } = await fetchKsdtRows(tableId);
      setRows(r || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load rows');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    categories,
    nodes,
    tables,
    rows,
    loading,
    error,
    setError,
    loadCategories,
    loadTree,
    loadKsdtTables,
    loadKsdtRows,
  };
}
