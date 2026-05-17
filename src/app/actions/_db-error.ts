import { AppError } from '@/lib/errors';

export function handleDbError(error: Error, context: string): AppError {
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
