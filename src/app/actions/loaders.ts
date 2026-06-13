/* eslint-disable @typescript-eslint/require-await */
'use server';

import {
  getAllLists,
  getAllLabels,
  getTasksByListId,
  getTasksDueToday,
  getTasksDueInNextDays,
  getAllTasks,
  type ListRow,
  type EnrichedLabelRow,
  type EnrichedTaskRow,
} from '@/lib/db';
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

function mapLabels(rawLabels: EnrichedLabelRow[]): Label[] {
  return rawLabels.map((l) => ({
    id: l.id,
    name: l.name,
    color: l.color,
    icon: l.icon,
    createdAt: l.created_at,
  }));
}

function mapTaskRowToTask(row: EnrichedTaskRow, listMap: Map<string, TaskList>): Task {
  const taskList = listMap.get(row.list_id);
  return {
    id: row.id,
    listId: row.list_id,
    parentId: row.parent_id || undefined,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    deadline: row.deadline,
    estimateMinutes: row.estimate_minutes,
    actualMinutes: row.actual_minutes,
    status: row.status as TaskStatus,
    priority: row.priority as Priority,
    recurrence: row.recurrence as RecurrenceType | undefined,
    recurrenceRule: row.recurrence_rule || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    labels: row.labels.map((l) => ({
      id: l.id,
      name: l.name,
      color: l.color,
      icon: l.icon,
      createdAt: l.created_at,
    })),
    subtasks: row.subtasks.map((s) => ({
      id: s.id,
      taskId: s.taskId,
      title: s.title,
      completed: s.completed,
      order: s.order,
      createdAt: s.createdAt,
    })),
    attachments: [],
    reminders: [],
    changeLogs: [],
    list: taskList
      ? { name: taskList.name, icon: taskList.icon, color: taskList.color }
      : undefined,
  };
}

function filterCompleted(tasks: EnrichedTaskRow[], showCompleted: boolean): EnrichedTaskRow[] {
  if (showCompleted) return tasks;
  return tasks.filter((t) => t.status !== 'completed');
}

function filterBySearch(tasks: EnrichedTaskRow[], searchQuery: string): EnrichedTaskRow[] {
  const trimmed = searchQuery.trim();
  if (!trimmed) return tasks;
  const lower = trimmed.toLowerCase();
  return tasks.filter(
    (t) => t.title.toLowerCase().includes(lower) || t.description.toLowerCase().includes(lower)
  );
}

function deduplicate(tasks: EnrichedTaskRow[]): EnrichedTaskRow[] {
  const map = new Map<string, EnrichedTaskRow>();
  for (const row of tasks) {
    if (!map.has(row.id)) {
      map.set(row.id, row);
    }
  }
  return Array.from(map.values());
}

function filterUpcoming(tasks: EnrichedTaskRow[]): EnrichedTaskRow[] {
  const now = new Date();
  return tasks.filter((row) => {
    const due = row.due_date || row.deadline;
    return due ? due >= now : false;
  });
}

function countOverdue(tasks: EnrichedTaskRow[]): number {
  return tasks.filter((t) => {
    if (t.status === 'completed') return false;
    const d = t.deadline || t.due_date;
    return d ? d < new Date() : false;
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
    const listMap = new Map(lists.map((l) => [l.id, l]));

    let tasksRows = getTasksForView(view, selectedListId);
    tasksRows = filterCompleted(tasksRows, showCompleted);
    tasksRows = filterBySearch(tasksRows, searchQuery);
    tasksRows = deduplicate(tasksRows);
    if (view === 'upcoming') {
      tasksRows = filterUpcoming(tasksRows);
    }

    const tasks = tasksRows.map((row) => mapTaskRowToTask(row, listMap));
    const overdueCount = countOverdue(tasksRows);

    return { tasks, lists, labels, overdueCount };
  } catch (error) {
    if (error instanceof Error && !(error instanceof AppError)) {
      throw handleDbError(error, 'loadAppData');
    }
    throw error;
  }
}

function getTasksForView(view: ViewType, selectedListId?: string | null): EnrichedTaskRow[] {
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
    default:
      return getAllTasks();
  }
}