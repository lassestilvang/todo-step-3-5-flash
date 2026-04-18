"use server";

import { db, getAllLists, getAllLabels, getTasksByListId, getTasksDueToday, getTasksDueInNextDays, getAllTasks, getOverdueTasks, createList, updateList, deleteList, createTask, updateTask, deleteTask, createSubtask, updateSubtask, deleteSubtask, createLabel, updateLabel, deleteLabel } from "@/lib/db";
import type { CreateTaskData, CreateListData, Task, TaskList, Label, ViewType } from "@/types";
import type { TaskRow, SubtaskRow } from "@/lib/db";

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

  // Build label map: taskId -> Label[]
  const labelMap: Record<string, Label[]> = {};
  for (const label of rawLabels) {
    const tasks = db.prepare(`
      SELECT task_id FROM task_labels WHERE label_id = ?
    `).all(label.id) as { task_id: string }[];
    for (const t of tasks) {
      if (!labelMap[t.task_id]) labelMap[t.task_id] = [];
      labelMap[t.task_id].push({
        id: label.id,
        name: label.name,
        color: label.color,
        icon: label.icon ?? undefined,
        createdAt: new Date(label.created_at),
      });
    }
  }

   // Determine which tasks to load
   let tasksRows: TaskRow[] = [];
   if (selectedListId) {
     tasksRows = getTasksByListId(selectedListId);
   } else {
     const now = new Date();
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
        // Filter future only after
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
   const uniqueMap = new Map<string, any>();
   for (const row of tasksRows) {
     if (!uniqueMap.has(row.id)) {
       uniqueMap.set(row.id, row);
     }
   }
   let uniqueTasks = Array.from(uniqueMap.values());

   // For upcoming view, filter to future tasks only
   if (view === "upcoming") {
     const now = new Date();
     uniqueTasks = uniqueTasks.filter((row) => {
       const due = row.due_date || row.deadline;
       return due ? new Date(due) >= now : false;
     });
   }

  // Fetch subtasks for all tasks
  const taskIds = uniqueTasks.map((t) => t.id);
  const subtasksMap: Record<string, any[]> = {};
  if (taskIds.length > 0) {
    const placeholders = taskIds.map(() => "?").join(",");
    const subtasks = db.prepare(`
      SELECT * FROM subtasks WHERE task_id IN (${placeholders}) ORDER BY task_id, order_index
    `).all(...taskIds) as any[];
    for (const st of subtasks) {
      if (!subtasksMap[st.task_id]) subtasksMap[st.task_id] = [];
      subtasksMap[st.task_id].push(st);
    }
  }

  // Build label map already done above; now just attach

  // Map to Task objects
  const tasks: Task[] = uniqueTasks.map((row) => ({
    id: row.id,
    listId: row.list_id,
    parentId: row.parent_id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date ? new Date(row.due_date) : undefined,
    deadline: row.deadline ? new Date(row.deadline) : undefined,
    estimateMinutes: row.estimate_minutes,
    actualMinutes: row.actual_minutes,
    status: row.status,
    priority: row.priority,
    recurrence: row.recurrence,
    recurrenceRule: row.recurrence_rule,
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
    attachments: [], // not implementing full for now
    reminders: [],
    changeLogs: [],
    list: (() => {
    const l = lists.find((l) => l.id === row.list_id);
    return l ? { name: l.name, icon: l.icon, color: l.color } : undefined;
  })(),
  }));

  // Count overdue
  const overdue = getOverdueTasks().length;

  return { tasks, lists, labels, overdueCount: overdue };
}

// ==================== LISTS ====================
export async function createListAction(data: CreateListData) {
  return createList(data);
}

export async function updateListAction(id: string, data: Partial<CreateListData>) {
  return updateList(id, data);
}

export async function deleteListAction(id: string) {
  return deleteList(id);
}

// ==================== TASKS ====================
export async function createTaskAction(data: CreateTaskData) {
  return createTask({
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
  if (data.labelIds !== undefined) updateData.label_ids = data.labelIds;
  return updateTask(id, updateData);
}

export async function deleteTaskAction(id: string) {
  return deleteTask(id);
}

export async function toggleTaskCompleteAction(id: string) {
  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as any;
  if (!existing) return;
  const newStatus = existing.status === "completed" ? "pending" : "completed";
  return updateTask(id, { status: newStatus });
}

// ==================== SUBTASKS ====================
export async function createSubtaskAction(taskId: string, title: string, order?: number) {
  return createSubtask({ task_id: taskId, title, order });
}

export async function updateSubtaskAction(id: string, data: { title?: string; completed?: boolean; order?: number }) {
  return updateSubtask(id, data);
}

export async function deleteSubtaskAction(id: string) {
  return deleteSubtask(id);
}

// ==================== LABELS ====================
export async function createLabelAction(name: string, color: string, icon?: string) {
  return createLabel({ name, color, icon });
}

export async function updateLabelAction(id: string, name: string, color: string, icon?: string) {
  return updateLabel(id, { name, color, icon });
}

export async function deleteLabelAction(id: string) {
  return deleteLabel(id);
}

