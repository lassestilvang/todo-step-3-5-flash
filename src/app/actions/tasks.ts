/* eslint-disable @typescript-eslint/require-await */
'use server';

import {
  db,
  createTask,
  updateTask,
  deleteTask,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  getTaskById,
  type TaskRow,
} from '@/lib/db';
import { AppError } from '@/lib/errors';
import {
  createTaskSchema,
  updateTaskSchema,
  createSubtaskSchema,
  updateSubtaskSchema,
} from '@/lib/validation';
import type { CreateTaskData } from '@/types';

import { toTask } from './_helpers';

function handleDbError(error: Error, context: string): AppError {
  const message = error.message.toLowerCase();
  if (
    message.includes('constraint') ||
    message.includes('unique') ||
    message.includes('foreign key')
  ) {
    return new AppError(`Failed to ${context}: data conflict`, 'CONSTRAINT', error);
  }
  if (message.includes('not found') || message.includes('no such table')) {
    return new AppError(`Resource not found during ${context}`, 'NOT_FOUND', error);
  }
  return new AppError(`Unexpected error during ${context}`, 'INTERNAL', error);
}

export async function createTaskAction(data: CreateTaskData) {
  try {
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
  } catch (error) {
    if (error instanceof Error && !(error instanceof AppError)) {
      throw handleDbError(error, 'createTask');
    }
    throw error;
  }
}

export async function updateTaskAction(id: string, data: Partial<CreateTaskData>) {
  try {
    const parsed = updateTaskSchema.parse(data);
    const updateData: {
      list_id?: string;
      parent_id?: string;
      title?: string;
      description?: string;
      due_date?: Date;
      deadline?: Date;
      estimate_minutes?: number;
      status?: string;
      priority?: string;
      recurrence?: string;
      recurrence_rule?: string;
    } = {};
    if (parsed.listId !== undefined) updateData.list_id = parsed.listId;
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.dueDate !== undefined) updateData.due_date = parsed.dueDate;
    if (parsed.deadline !== undefined) updateData.deadline = parsed.deadline;
    if (parsed.estimateMinutes !== undefined) updateData.estimate_minutes = parsed.estimateMinutes;
    if (parsed.priority !== undefined) updateData.priority = parsed.priority;
    if (parsed.recurrence !== undefined) updateData.recurrence = parsed.recurrence;
    if (parsed.parentId !== undefined) updateData.parent_id = parsed.parentId;
    const result = updateTask(id, updateData);
    if (!result) return null;
    const full = getTaskById(id);
    return full ? toTask(full) : null;
  } catch (error) {
    if (error instanceof Error && !(error instanceof AppError)) {
      throw handleDbError(error, 'updateTask');
    }
    throw error;
  }
}

export async function deleteTaskAction(id: string) {
  try {
    deleteTask(id);
    return { id };
  } catch (error) {
    if (error instanceof Error && !(error instanceof AppError)) {
      throw handleDbError(error, 'deleteTask');
    }
    throw error;
  }
}

export async function toggleTaskCompleteAction(id: string) {
  try {
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined;
    if (!existing) {
      throw new AppError('Task not found', 'NOT_FOUND');
    }
    const newStatus = existing.status === 'completed' ? 'pending' : 'completed';
    updateTask(id, { status: newStatus });
    const full = getTaskById(id);
    return full ? toTask(full) : null;
  } catch (error) {
    if (error instanceof Error && !(error instanceof AppError)) {
      throw handleDbError(error, 'toggleTaskComplete');
    }
    throw error;
  }
}

export async function createSubtaskAction(taskId: string, title: string, order?: number) {
  try {
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
  } catch (error) {
    if (error instanceof Error && !(error instanceof AppError)) {
      throw handleDbError(error, 'createSubtask');
    }
    throw error;
  }
}

export async function updateSubtaskAction(
  subtaskId: string,
  data: { title?: string; completed?: boolean; order?: number }
) {
  try {
    const parsed = updateSubtaskSchema.parse(data);
    const updateData: { title?: string; completed?: boolean; order_index?: number } = {};
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.completed !== undefined) updateData.completed = parsed.completed;
    if (parsed.order !== undefined) updateData.order_index = parsed.order;
    const result = updateSubtask(subtaskId, updateData);
    if (!result) return null;
    return {
      id: result.id,
      taskId: result.task_id,
      title: result.title,
      completed: result.completed === 1,
      order: result.order_index,
      createdAt: new Date(result.created_at),
    };
  } catch (error) {
    if (error instanceof Error && !(error instanceof AppError)) {
      throw handleDbError(error, 'updateSubtask');
    }
    throw error;
  }
}

export async function deleteSubtaskAction(subtaskId: string) {
  try {
    deleteSubtask(subtaskId);
    return { id: subtaskId };
  } catch (error) {
    if (error instanceof Error && !(error instanceof AppError)) {
      throw handleDbError(error, 'deleteSubtask');
    }
    throw error;
  }
}
