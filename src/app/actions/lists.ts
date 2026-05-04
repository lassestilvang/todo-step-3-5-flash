/* eslint-disable @typescript-eslint/require-await */
'use server';

import { createList, updateList, deleteList } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { createListSchema, updateListSchema } from '@/lib/validation';
import type { CreateListData } from '@/types';

import { toList } from './_helpers';

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

export async function createListAction(data: CreateListData) {
  try {
    const parsed = createListSchema.parse(data);
    const row = createList({
      name: parsed.name,
      color: parsed.color,
      icon: parsed.icon ?? '📋',
      parent_id: parsed.parentId,
    });
    return toList(row);
  } catch (error) {
    if (error instanceof Error && !(error instanceof AppError)) {
      throw handleDbError(error, 'createList');
    }
    throw error;
  }
}

export async function updateListAction(id: string, data: Partial<CreateListData>) {
  try {
    const parsed = updateListSchema.parse(data);
    const updateData: {
      name?: string;
      color?: string;
      icon?: string;
      parent_id?: string;
      order?: number;
    } = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.color !== undefined) updateData.color = parsed.color;
    if (parsed.icon !== undefined) updateData.icon = parsed.icon;
    if (parsed.parentId !== undefined) updateData.parent_id = parsed.parentId;
    const result = updateList(id, updateData);
    if (!result) return null;
    return toList(result);
  } catch (error) {
    if (error instanceof Error && !(error instanceof AppError)) {
      throw handleDbError(error, 'updateList');
    }
    throw error;
  }
}

export async function deleteListAction(id: string) {
  try {
    deleteList(id);
    return { id };
  } catch (error) {
    if (error instanceof Error && !(error instanceof AppError)) {
      throw handleDbError(error, 'deleteList');
    }
    throw error;
  }
}
