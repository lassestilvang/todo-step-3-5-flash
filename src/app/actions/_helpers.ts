import { getListById } from "@/lib/db";
import type { Task, TaskList, Label, TaskStatus, Priority, RecurrenceType } from "@/types";
import type { TaskRow, SubtaskRow, LabelRow, ListRow } from "@/lib/db";

export function toTask(row: TaskRow & { labels: LabelRow[]; subtasks: SubtaskRow[] }): Task {
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

export function toList(row: ListRow): TaskList {
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

export function toLabel(row: LabelRow): Label {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon ?? undefined,
    createdAt: new Date(row.created_at),
  };
}
