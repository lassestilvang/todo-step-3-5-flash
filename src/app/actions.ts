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
  getTaskById,
  getListById,
  createList,
  updateList,
  deleteList,
  createTask,
  updateTask,
  deleteTask,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  createLabel,
  updateLabel,
  deleteLabel,
} from "@/lib/db";
import type {
  CreateTaskData,
  CreateListData,
  Task,
  TaskList,
  Label,
  ViewType,
  TaskStatus,
  Priority,
  RecurrenceType,
  Subtask,
} from "@/types";
import type { TaskRow, SubtaskRow, LabelRow, ListRow } from "@/lib/db";

// ==================== CONVERTERS ====================

function toTask(row: TaskRow & { labels: LabelRow[]; subtasks: SubtaskRow[] }): Task {
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
    labels: row.labels.map((l) => ({
      id: l.id,
      name: l.name,
      color: l.color,
      icon: l.icon ?? undefined,
      createdAt: new Date(l.created_at),
    })),
    subtasks: row.subtasks.map((s) => ({
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
    list: (() => {
      const listRow = getListById(row.list_id);
      return listRow ? { name: listRow.name, icon: listRow.icon, color: listRow.color } : undefined;
    })(),
  };
}

function toList(row: ListRow): TaskList {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    isMagic: !!row.is_magic,
    parentId: row.parent_id ?? undefined,
    order: row.order_index,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function toLabel(row: LabelRow): Label {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

// ==================== DATA LOADING ====================

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

  const lists: TaskList[] = rawLists.map(toList);
  const labels: Label[] = rawLabels.map(toLabel);

  // Build label map using a single batch join query (fixes N+1)
  const labelMap: Record<string, Label[]> = {};
  if (rawLabels.length > 0) {
    const placeholders = rawLabels.map(() => "?").join(",");
    const taskLabels = db.prepare(`
      SELECT tl.task_id, l.id, l.name, l.color, l.icon, l.created_at
      FROM task_labels tl
      JOIN labels l ON tl.label_id = l.id
      WHERE l.id IN (${placeholders})
    `).all(...rawLabels.map((l) => l.id)) as Array<{
      task_id: string;
      id: string;
      name: string;
      color: string;
      icon: string | null;
      created_at: string;
    }>;

    for (const tl of taskLabels) {
      if (!labelMap[tl.task_id]) labelMap[tl.task_id] = [];
      labelMap[tl.task_id].push(toLabel(tl));
    }
  }

  // Determine which tasks to load
  let tasksRows: TaskRow[] = [];
  if (selectedListId) {
    tasksRows = getTasksByListId(selectedListId);
  } else {
    let rawTasks: TaskRow[] = [];
    switch (view) {
      case "today":
        rawTasks = getTasksDueToday();
        break;
      case "week":
        rawTasks = getTasksDueInNextDays(7);
        break;
      case "upcoming":
        rawTasks = getAllTasks();
        break;
      case "all":
        rawTasks = getAllTasks();
        break;
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
    tasksRows = tasksRows.filter(
      (t) =>
        t.title.toLowerCase().includes(lower) ||
        t.description.toLowerCase().includes(lower)
    );
  }

  // Deduplicate
  const uniqueMap = new Map<string, TaskRow>();
  for (const row of tasksRows) {
    if (!uniqueMap.has(row.id)) uniqueMap.set(row.id, row);
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

  // Batch fetch subtasks
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

  // Build tasks with relations
  const tasks = uniqueTasks.map((row): Task => {
    const taskLabels = labelMap[row.id] || [];
    const taskSubtasks = subtasksMap[row.id] || [];
    return toTask({
      ...row,
      labels: taskLabels as unknown as LabelRow[],
      subtasks: taskSubtasks as unknown as SubtaskRow[],
    });
  });

  // Count overdue
  const overdue = getOverdueTasks().length;

  return { tasks, lists, labels, overdueCount: overdue };
}

// ==================== LISTS ====================

export async function createListAction(data: CreateListData) {
  const row = createList(data);
  return toList(row);
}

export async function updateListAction(id: string, data: Partial<CreateListData>) {
  const result = updateList(id, data);
  if (!result) return null;
  return toList(result);
}

export async function deleteListAction(id: string) {
  deleteList(id);
  return { id };
}

// ==================== TASKS ====================

export async function createTaskAction(data: CreateTaskData) {
  const row = createTask({
    list_id: data.listId,
    title: data.title,
    description: data.description,
    due_date: data.dueDate,
    deadline: data.deadline,
    estimate_minutes: data.estimateMinutes,
    priority: data.priority,
    recurrence: data.recurrence,
    parent_id: data.parentId,
    label_ids: data.labelIds,
  });
  const full = getTaskById(row.id);
  return full ? toTask(full) : null;
}

export async function updateTaskAction(id: string, data: Partial<CreateTaskData>) {
  const updateData: any = {};
  if (data.listId !== undefined) updateData.list_id = data.listId;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
  if (data.deadline !== undefined) updateData.deadline = data.deadline;
  if (data.estimateMinutes !== undefined) updateData.estimate_minutes = data.estimateMinutes;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.recurrence !== undefined) updateData.recurrence = data.recurrence;
  if (data.parentId !== undefined) updateData.parent_id = data.parentId;
  const result = updateTask(id, updateData);
  if (!result) return null;
  const full = getTaskById(id);
  return full ? toTask(full) : null;
}

export async function deleteTaskAction(id: string) {
  deleteTask(id);
  return { id };
}

export async function toggleTaskCompleteAction(id: string) {
  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow | null;
  if (!existing) return null;
  const newStatus = existing.status === "completed" ? "pending" : "completed";
  updateTask(id, { status: newStatus });
  const full = getTaskById(id);
  return full ? toTask(full) : null;
}

// ==================== SUBTASKS ====================

export async function createSubtaskAction(taskId: string, title: string, order?: number) {
  const row = createSubtask({ task_id: taskId, title, order });
  return {
    id: row.id,
    taskId: row.task_id,
    title: row.title,
    completed: row.completed === 1,
    order: row.order_index,
    createdAt: new Date(row.created_at),
  };
}

export async function updateSubtaskAction(
  id: string,
  data: { title?: string; completed?: boolean; order?: number }
) {
  const result = updateSubtask(id, data);
  if (!result) return null;
  return {
    id: result.id,
    taskId: result.task_id,
    title: result.title,
    completed: result.completed === 1,
    order: result.order_index,
    createdAt: new Date(result.created_at),
  };
}

export async function deleteSubtaskAction(id: string) {
  deleteSubtask(id);
  return { id };
}

// ==================== LABELS ====================

export async function createLabelAction(name: string, color: string, icon?: string) {
  const row = createLabel({ name, color, icon });
  return toLabel(row);
}

export async function updateLabelAction(id: string, name: string, color: string, icon?: string) {
  const result = updateLabel(id, { name, color, icon });
  if (!result) return null;
  return toLabel(result);
}

export async function deleteLabelAction(id: string) {
  deleteLabel(id);
  return { id };
}
