/**
 * Admin Curriculum Control Center — fetch wrappers (Vercel /api routes).
 */

const json = async (res: Response) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText || 'Request failed');
  }
  return data;
};

export async function fetchExamCategories() {
  const res = await fetch('/api/admin/exam-categories');
  return json(res) as Promise<{ categories: ExamCategory[] }>;
}

export async function createExamCategory(payload: {
  slug: string;
  name: string;
  examType?: string | null;
  description?: string;
  displayOrder?: number;
}) {
  const res = await fetch('/api/admin/exam-categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: payload.slug,
      name: payload.name,
      examType: payload.examType,
      description: payload.description,
      displayOrder: payload.displayOrder,
    }),
  });
  return json(res) as Promise<{ category: ExamCategory }>;
}

export async function fetchCurriculumTree(examCategoryId?: string | null) {
  const q = examCategoryId ? `?examCategoryId=${encodeURIComponent(examCategoryId)}` : '';
  const res = await fetch(`/api/admin/curriculum-tree${q}`);
  return json(res) as Promise<{ nodes: CurriculumNode[] }>;
}

export async function createCurriculumNode(payload: CreateNodePayload) {
  const res = await fetch('/api/admin/curriculum-tree', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return json(res) as Promise<{ node: CurriculumNode }>;
}

export async function patchCurriculumNode(payload: PatchNodePayload) {
  const res = await fetch('/api/admin/curriculum-tree', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return json(res) as Promise<{ node: CurriculumNode }>;
}

export async function deleteCurriculumNode(id: string) {
  const res = await fetch('/api/admin/curriculum-tree', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  return json(res) as Promise<{ success: boolean }>;
}

export async function fetchKsdtTables() {
  const res = await fetch('/api/admin/ksdt-tables');
  return json(res) as Promise<{ tables: KsdtTable[] }>;
}

export async function createKsdtTable(payload: { name: string; description?: string; examCategoryId?: string | null }) {
  const res = await fetch('/api/admin/ksdt-tables', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: payload.name,
      description: payload.description,
      examCategoryId: payload.examCategoryId,
    }),
  });
  return json(res) as Promise<{ table: KsdtTable }>;
}

export async function fetchKsdtRows(tableId: string) {
  const res = await fetch(`/api/admin/ksdt-rows?tableId=${encodeURIComponent(tableId)}`);
  return json(res) as Promise<{ rows: KsdtRow[] }>;
}

export async function createKsdtRow(payload: {
  ksdtTableId: string;
  learningObjectiveId?: string | null;
  questionCount?: number;
  difficulty?: string;
}) {
  const res = await fetch('/api/admin/ksdt-rows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return json(res) as Promise<{ row: KsdtRow }>;
}

export async function patchKsdtRow(payload: {
  id: string;
  learningObjectiveId?: string | null;
  questionCount?: number;
  difficulty?: string;
  sortOrder?: number;
}) {
  const res = await fetch('/api/admin/ksdt-rows', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return json(res) as Promise<{ row: KsdtRow }>;
}

export async function deleteKsdtRow(id: string) {
  const res = await fetch('/api/admin/ksdt-rows', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  return json(res) as Promise<{ success: boolean }>;
}

export async function generateExam(ksdtTableId: string, title?: string) {
  const res = await fetch('/api/exam/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ksdtTableId, title, useAi: true }),
  });
  return json(res) as Promise<{ examId: string; questionCount: number; message?: string }>;
}

export async function publishExam(examId: string) {
  const res = await fetch('/api/exam/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ examId }),
  });
  return json(res) as Promise<{ exam: { id: string; status: string } }>;
}

export async function listExams(status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`/api/exam/list${q}`);
  return json(res) as Promise<{ exams: Exam[] }>;
}

export interface ExamCategory {
  id: string;
  slug: string;
  name: string;
  exam_type: string | null;
  display_order: number;
}

export interface CurriculumNode {
  id: string;
  code: string;
  name: string;
  type: string;
  parent_id: string | null;
  exam_category_id: string | null;
  sort_order: number;
  difficulty: number;
  prerequisites: string[];
  metadata: Record<string, unknown>;
}

export interface CreateNodePayload {
  code: string;
  name: string;
  type: string;
  parentId?: string | null;
  examCategoryId?: string | null;
  sortOrder?: number;
  difficulty?: number;
  prerequisites?: string[];
  metadata?: Record<string, unknown>;
}

export interface PatchNodePayload {
  id: string;
  name?: string;
  code?: string;
  parentId?: string | null;
  examCategoryId?: string | null;
  sortOrder?: number;
  difficulty?: number;
  prerequisites?: string[];
  metadata?: Record<string, unknown>;
  type?: string;
}

export interface KsdtTable {
  id: string;
  name: string;
  description: string | null;
  exam_category_id: string | null;
  created_at: string;
}

export interface KsdtRow {
  id: string;
  ksdt_table_id: string;
  learning_objective_id: string | null;
  question_count: number;
  difficulty: string;
  question_type: string;
  sort_order: number;
  learning_objective?: CurriculumNode | null;
}

export interface Exam {
  id: string;
  title: string;
  status: string;
  ksdt_table_id: string | null;
  created_at: string;
}
