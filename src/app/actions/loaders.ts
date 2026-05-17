/* eslint-disable @typescript-eslint/require-await */
'use server';

import {
  db,
  getAllLists,
  getAllLabels,
  getTasksByListId,
  getTasksDueToday,
  getTasksDueInNextDays,
  getAllTasks,
} from '@/lib/db';
import type { TaskRow, SubtaskRow, ListRow, LabelRow } from '@/lib/db';
import { AppError } from '@/lib/errors';
import type {
  Task,
  TaskList,
  Label,
  ViewType,
  TaskStatus,
  Priority,
  RecurrenceType,
} from '@/types';

import { handleDbError } from './_db-error';

function mapLists(rawLists: ListRow[]): TaskList[] {
  return rawLists.map((l) => ({
    id: l.id,
    name: l.name,
    color: l.color,
    icon: l.icon,
    isMagic: !!l.is_magic,
    parentId: l.parent_id ?? undefined,
    order: l.order_index,
    createdAt: new Date(l.created_at),
    updatedAt: new Date(l.updated_at),
  }));
}

function mapLabels(rawLabels: LabelRow[]): Label[] {
  return rawLabels.map((l) => ({
    id: l.id,
    name: l.name,
    color: l.color,
    icon: l.icon ?? undefined,
    createdAt: new Date(l.created_at),
  }));
}

function buildLabelMap(): Record<string, Label[]> {
  const labelMap: Record<string, Label[]> = {};
  const taskLabels = db
    .prepare(
      `
      SELECT tl.task_id, l.id, l.name, l.color, l.icon, l.created_at
      FROM task_labels tl
      JOIN labels l ON tl.label_id = l.id
    `
    )
    .all() as Array<{
    task_id: string;
    id: string;
    name: string;
    color: string;
    icon: string | null;
    created_at: string;
  }>;
  for (const tl of taskLabels) {
    if (!labelMap[tl.task_id]) labelMap[tl.task_id] = [];
    labelMap[tl.task_id]!.push({
      id: tl.id,
      name: tl.name,
      color: tl.color,
      icon: tl.icon ?? undefined,
      createdAt: new Date(tl.created_at),
    });
  }
  return labelMap;
}

function fetchTaskRows(params: { view: ViewType; selectedListId?: string | null }): TaskRow[] {
  const { view, selectedListId } = params;
  if (selectedListId) {
    return getTasksByListId(selectedListId);
  }
  switch (view) {
    case 'today':
      return getTasksDueToday();
    case 'week':
      return getTasksDueInNextDays(7);
    case 'upcoming':
    case 'all':
      return getAllTasks();
    default:
      return getAllTasks();
  }
}

function filterCompleted(tasks: TaskRow[], showCompleted: boolean): TaskRow[] {
  if (showCompleted) return tasks;
  return tasks.filter((t) => t.status !== 'completed');
}

function filterBySearch(tasks: TaskRow[], searchQuery: string): TaskRow[] {
  const trimmed = searchQuery.trim();
  if (!trimmed) return tasks;
  const lower = trimmed.toLowerCase();
  return tasks.filter(
    (t) => t.title.toLowerCase().includes(lower) || t.description.toLowerCase().includes(lower)
  );
}

function deduplicate(tasks: TaskRow[]): TaskRow[] {
  const map = new Map<string, TaskRow>();
  for (const row of tasks) {
    if (!map.has(row.id)) {
      map.set(row.id, row);
    }
  }
  return Array.from(map.values());
}

function filterUpcoming(tasks: TaskRow[]): TaskRow[] {
  const now = new Date();
  return tasks.filter((row) => {
    const due = row.due_date || row.deadline;
    return due ? new Date(due) >= now : false;
  });
}

async function fetchSubtasksMap(taskIds: string[]): Promise<Record<string, SubtaskRow[]>> {
  if (taskIds.length === 0) return {};
  const placeholders = taskIds.map(() => '?').join(',');
  const subtasks = db
    .prepare(
      `
      SELECT * FROM subtasks WHERE task_id IN (${placeholders}) ORDER BY task_id, order_index
    `
    )
    .all(...taskIds) as SubtaskRow[];
  const map: Record<string, SubtaskRow[]> = {};
  for (const st of subtasks) {
    (map[st.task_id] ??= []).push(st);
  }
  return map;
}

function mapRowsToTasks(
  rows: TaskRow[],
  lists: TaskList[],
  labelMap: Record<string, Label[]>,
  subtasksMap: Record<string, SubtaskRow[]>
): Task[] {
  const listMap = new Map(lists.map((l) => [l.id, l]));
  return rows.map((row): Task => {
    const taskList = listMap.get(row.list_id);
    return {
      id: row.id,
      listId: row.list_id,
      parentId: row.parent_id || undefined,
      title: row.title,
      description: row.description,
      dueDate: row.due_date ? new Date(row.due_date) : undefined,
      deadline: row.deadline ? new Date(row.deadline) : undefined,
      estimateMinutes: row.estimate_minutes,
      actualMinutes: row.actual_minutes,
      status: row.status as TaskStatus,
      priority: row.priority as Priority,
      recurrence: row.recurrence ? (row.recurrence as RecurrenceType) : undefined,
      recurrenceRule: row.recurrence_rule || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      labels: labelMap[row.id] || [],
      subtasks: (subtasksMap[row.id] || []).map((s) => ({
        id: s.id,
        taskId: s.task_id,
        title: s.title,
        completed: s.completed === 1,
        order: s.order_index,
        createdAt: new Date(s.created_at),
      })),
      attachments: [],
      reminders: [],
      changeLogs: [],
      list: taskList
        ? { name: taskList.name, icon: taskList.icon, color: taskList.color }
        : undefined,
    };
  });
}

function countOverdue(tasks: TaskRow[]): number {
  return tasks.filter((t) => {
    if (t.status === 'completed') return false;
    const d = t.deadline || t.due_date;
    return d ? new Date(d) < new Date() : false;
  }).length;
}

export async function loadAppData(params: {
  view: ViewType;
  selectedListId?: string | null;
  showCompleted: boolean;
  searchQuery: string;
}) {
  try {
    const { view, selectedListId, showCompleted, searchQuery } = params;

    const rawLists = getAllLists();
    const rawLabels = getAllLabels();
    const lists = mapLists(rawLists);
    const labels = mapLabels(rawLabels);

    const labelMap = buildLabelMap();

    let tasksRows = fetchTaskRows({ view, selectedListId });
    tasksRows = filterCompleted(tasksRows, showCompleted);
    tasksRows = filterBySearch(tasksRows, searchQuery);
    tasksRows = deduplicate(tasksRows);
    if (view === 'upcoming') {
      tasksRows = filterUpcoming(tasksRows);
    }

    const taskIds = tasksRows.map((t) => t.id);
    const subtasksMap = await fetchSubtasksMap(taskIds);

    const tasks = mapRowsToTasks(tasksRows, lists, labelMap, subtasksMap);
    const overdueCount = countOverdue(tasksRows);

    return { tasks, lists, labels, overdueCount };
  } catch (error) {
    if (error instanceof Error && !(error instanceof AppError)) {
      throw handleDbError(error, 'loadAppData');
    }
    throw error;
  }
}
