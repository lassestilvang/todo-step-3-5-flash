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
  type EnrichedTaskRow,
} from '@/lib/db';
import { AppError } from '@/lib/errors';
import {
  createTaskSchema,
  updateTaskSchema,
  createSubtaskSchema,
  updateSubtaskSchema,
} from '@/lib/validation';
import type { CreateTaskData } from '@/types';

import { handleDbError } from './_db-error';
import { toTask } from './_helpers';

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

export async function updateTaskAction(id: string, data: Partial<CreateTaskData> & { status?: string }) {
  try {
    const parsed = updateTaskSchema.parse(data);
    type UpdateKey =
      | 'listId'
      | 'parentId'
      | 'title'
      | 'description'
      | 'dueDate'
      | 'deadline'
      | 'estimateMinutes'
      | 'priority'
      | 'recurrence';
    const fieldMap: Array<{ key: UpdateKey; dbKey: string }> = [
      { key: 'listId', dbKey: 'list_id' },
      { key: 'parentId', dbKey: 'parent_id' },
      { key: 'title', dbKey: 'title' },
      { key: 'description', dbKey: 'description' },
      { key: 'dueDate', dbKey: 'due_date' },
      { key: 'deadline', dbKey: 'deadline' },
      { key: 'estimateMinutes', dbKey: 'estimate_minutes' },
      { key: 'priority', dbKey: 'priority' },
      { key: 'recurrence', dbKey: 'recurrence' },
    ];
    const updateData: Record<string, unknown> = {};
    for (const { key, dbKey } of fieldMap) {
      const value = parsed[key];
      if (value !== undefined) {
        updateData[dbKey] = value;
      }
    }
    if (parsed.status !== undefined) {
      updateData.status = parsed.status;
    }
    const result = updateTask(id, updateData as Parameters<typeof updateTask>[1]);
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
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as EnrichedTaskRow | undefined;
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

export async function deleteCompletedTasksAction(): Promise<{ deleted: number }> {
  try {
    const stmt = db.prepare("DELETE FROM tasks WHERE status = 'completed'");
    const result = stmt.run();
    return { deleted: result.changes };
  } catch (error) {
    if (error instanceof Error && !(error instanceof AppError)) {
      throw handleDbError(error, 'deleteCompletedTasks');
    }
    throw error;
  }
}
