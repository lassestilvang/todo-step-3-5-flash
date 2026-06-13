import { getListById } from '@/lib/db';
import type { EnrichedTaskRow, ListRow, EnrichedLabelRow } from '@/lib/db';
import type { Task, TaskList, Label, TaskStatus, Priority, RecurrenceType } from '@/types';

export function toTask(row: EnrichedTaskRow): Task {
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

export function toLabel(row: EnrichedLabelRow): Label {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    createdAt: row.created_at,
  };
}
