"use server";

import { db, createTask, updateTask, deleteTask, createSubtask, updateSubtask, deleteSubtask, getTaskById, type TaskRow } from "@/lib/db";
import type { CreateTaskData } from "@/types";
import { toTask } from "./_helpers";
import {
  createTaskSchema,
  updateTaskSchema,
  createSubtaskSchema,
  updateSubtaskSchema,
} from "@/lib/validation";

export async function createTaskAction(data: CreateTaskData) {
  const parsed = createTaskSchema.parse(data);
  const row = createTask({
    list_id: parsed.listId,
    title: parsed.title,
    description: parsed.description,
    due_date: parsed.dueDate,
    deadline: parsed.deadline,
    estimate_minutes: parsed.estimateMinutes,
    priority: parsed.priority,
    recurrence: parsed.recurrence,
    parent_id: parsed.parentId,
    label_ids: parsed.labelIds,
  });
  const full = getTaskById(row.id);
  return full ? toTask(full) : null;
}

export async function updateTaskAction(id: string, data: Partial<CreateTaskData>) {
  const parsed = updateTaskSchema.parse(data);
  const updateData: Partial<TaskRow> = {};
  if (parsed.listId !== undefined) (updateData as Record<string, unknown>).list_id = parsed.listId;
  if (parsed.title !== undefined) (updateData as Record<string, unknown>).title = parsed.title;
  if (parsed.description !== undefined) (updateData as Record<string, unknown>).description = parsed.description;
  if (parsed.dueDate !== undefined) (updateData as Record<string, unknown>).due_date = parsed.dueDate;
  if (parsed.deadline !== undefined) (updateData as Record<string, unknown>).deadline = parsed.deadline;
  if (parsed.estimateMinutes !== undefined) (updateData as Record<string, unknown>).estimate_minutes = parsed.estimateMinutes;
  if (parsed.priority !== undefined) (updateData as Record<string, unknown>).priority = parsed.priority;
  if (parsed.recurrence !== undefined) (updateData as Record<string, unknown>).recurrence = parsed.recurrence;
  if (parsed.parentId !== undefined) (updateData as Record<string, unknown>).parent_id = parsed.parentId;
  if (parsed.labelIds !== undefined) (updateData as Record<string, unknown>).label_ids = parsed.labelIds;
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
  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow | undefined;
  if (!existing) return null;
  const newStatus = existing.status === "completed" ? "pending" : "completed";
  updateTask(id, { status: newStatus });
  const full = getTaskById(id);
  return full ? toTask(full) : null;
}

export async function createSubtaskAction(taskId: string, title: string, order?: number) {
  const parsed = createSubtaskSchema.parse({ taskId, title, order });
  const row = createSubtask({
    task_id: parsed.taskId,
    title: parsed.title,
    order: parsed.order,
  });
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
  const parsed = updateSubtaskSchema.parse(data);
  const result = updateSubtask(id, parsed);
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
