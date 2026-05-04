/* eslint-disable @typescript-eslint/require-await */
'use server';

import { createLabel, updateLabel, deleteLabel } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { createLabelSchema, updateLabelSchema } from '@/lib/validation';

import { toLabel } from './_helpers';

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

export async function createLabelAction(name: string, color: string, icon?: string) {
  try {
    const parsed = createLabelSchema.parse({ name, color, icon });
    const row = createLabel({
      name: parsed.name,
      color: parsed.color,
      icon: parsed.icon,
    });
    return toLabel(row);
  } catch (error) {
    if (error instanceof Error && !(error instanceof AppError)) {
      throw handleDbError(error, 'createLabel');
    }
    throw error;
  }
}

export async function updateLabelAction(id: string, name: string, color: string, icon?: string) {
  try {
    const parsed = updateLabelSchema.parse({ name, color, icon });
    const result = updateLabel(id, {
      name: parsed.name,
      color: parsed.color,
      icon: parsed.icon,
    });
    if (!result) return null;
    return toLabel(result);
  } catch (error) {
    if (error instanceof Error && !(error instanceof AppError)) {
      throw handleDbError(error, 'updateLabel');
    }
    throw error;
  }
}

export async function deleteLabelAction(id: string) {
  try {
    deleteLabel(id);
    return { id };
  } catch (error) {
    if (error instanceof Error && !(error instanceof AppError)) {
      throw handleDbError(error, 'deleteLabel');
    }
    throw error;
  }
}
