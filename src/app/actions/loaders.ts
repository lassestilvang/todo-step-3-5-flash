"use server";

import {
  db,
  getAllLists,
  getAllLabels,
  getTasksByListId,
  getTasksDueToday,
  getTasksDueInNextDays,
  getAllTasks,
  getOverdueTasks,
} from "@/lib/db";
import type {
  Task,
  TaskList,
  Label,
  ViewType,
  TaskStatus,
  Priority,
  RecurrenceType,
} from "@/types";
import type { TaskRow, SubtaskRow } from "@/lib/db";

export async function loadAppData(params: {
  view: ViewType;
  selectedListId?: string | null;
  showCompleted: boolean;
  searchQuery: string;
}) {
  const { view, selectedListId, showCompleted, searchQuery } = params;

  // Fetch lists and labels
  const rawLists = getAllLists();
  const rawLabels = getAllLabels();

  const lists: TaskList[] = rawLists.map((l) => ({
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

  const labels: Label[] = rawLabels.map((l) => ({
    id: l.id,
    name: l.name,
    color: l.color,
    icon: l.icon ?? undefined,
    createdAt: new Date(l.created_at),
  }));

  // Build label map: taskId -> Label[] (single batch query)
  const labelMap: Record<string, Label[]> = {};
  const taskLabels = db.prepare(`
    SELECT tl.task_id, l.id, l.name, l.color, l.icon, l.created_at
    FROM task_labels tl
    JOIN labels l ON tl.label_id = l.id
  `).all() as Array<{
    task_id: string;
    id: string;
    name: string;
    color: string;
    icon: string | null;
    created_at: string;
  }>;
  for (const tl of taskLabels) {
    if (!labelMap[tl.task_id]) labelMap[tl.task_id] = [];
    labelMap[tl.task_id].push({
      id: tl.id,
      name: tl.name,
      color: tl.color,
      icon: tl.icon ?? undefined,
      createdAt: new Date(tl.created_at),
    });
  }

  // Determine which tasks to load
  let tasksRows: TaskRow[] = [];
  if (selectedListId) {
    tasksRows = getTasksByListId(selectedListId);
  } else {
    let rawTasks: TaskRow[] = [];
    switch (view) {
      case "today": {
        rawTasks = getTasksDueToday();
        break;
      }
      case "week": {
        rawTasks = getTasksDueInNextDays(7);
        break;
      }
      case "upcoming": {
        rawTasks = getAllTasks();
        break;
      }
      case "all": {
        rawTasks = getAllTasks();
        break;
      }
    }
    tasksRows = rawTasks;
  }

  // Filter completed
  if (!showCompleted) {
    tasksRows = tasksRows.filter((t) => t.status !== "completed");
  }

  // Search filter
  if (searchQuery.trim()) {
    const lower = searchQuery.toLowerCase();
    tasksRows = tasksRows.filter((t) =>
      t.title.toLowerCase().includes(lower) ||
      t.description.toLowerCase().includes(lower)
    );
  }

  // Deduplicate (due to OR conditions)
  const uniqueMap = new Map<string, TaskRow>();
  for (const row of tasksRows) {
    if (!uniqueMap.has(row.id)) {
      uniqueMap.set(row.id, row);
    }
  }
  let uniqueTasks = Array.from(uniqueMap.values()) as TaskRow[];

  // For upcoming view, filter to future tasks only
  if (view === "upcoming") {
    const now = new Date();
    uniqueTasks = uniqueTasks.filter((row) => {
      const due = row.due_date || row.deadline;
      return due ? new Date(due) >= now : false;
    });
  }

  // Fetch subtasks for these tasks
  const taskIds = uniqueTasks.map((t) => t.id);
  const subtasksMap: Record<string, SubtaskRow[]> = {};
  if (taskIds.length > 0) {
    const placeholders = taskIds.map(() => "?").join(",");
    const subtasks = db.prepare(`
      SELECT * FROM subtasks WHERE task_id IN (${placeholders}) ORDER BY task_id, order_index
    `).all(...taskIds) as SubtaskRow[];
    for (const st of subtasks) {
      if (!subtasksMap[st.task_id]) subtasksMap[st.task_id] = [];
      subtasksMap[st.task_id].push(st);
    }
  }

  // Map to Task objects with inline list lookup
  const listMap = new Map(lists.map((l) => [l.id, l]));
  const tasks = uniqueTasks.map((row): Task => {
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
      list: taskList ? { name: taskList.name, icon: taskList.icon, color: taskList.color } : undefined,
    };
  });

  const overdue = getOverdueTasks().length;

  return { tasks, lists, labels, overdueCount: overdue };
}
