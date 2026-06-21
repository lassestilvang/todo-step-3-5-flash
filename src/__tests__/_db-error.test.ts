import { describe, it, expect } from 'vitest';

import { handleDbError } from '@/app/actions/_db-error';

describe('handleDbError', () => {
  it('should return CONSTRAINT error for constraint violation', () => {
    const error = new Error('UNIQUE constraint failed: labels.name');
    const result = handleDbError(error, 'createLabel');

    expect(result.code).toBe('CONSTRAINT');
    expect(result.message).toContain('createLabel');
    expect(result.message).toContain('data conflict');
  });

  it('should return CONSTRAINT error for foreign key violation', () => {
    const error = new Error('FOREIGN KEY constraint failed');
    const result = handleDbError(error, 'updateTask');

    expect(result.code).toBe('CONSTRAINT');
  });

  it('should return NOT_FOUND error for not found', () => {
    const error = new Error('no such table: tasks');
    const result = handleDbError(error, 'loadData');

    expect(result.code).toBe('NOT_FOUND');
  });

  it('should return NOT_FOUND error for resource not found', () => {
    const error = new Error('Task not found');
    const result = handleDbError(error, 'deleteTask');

    expect(result.code).toBe('NOT_FOUND');
  });

  it('should return INTERNAL error for other errors', () => {
    const error = new Error('Something went wrong');
    const result = handleDbError(error, 'someOperation');

    expect(result.code).toBe('INTERNAL');
    expect(result.message).toContain('someOperation');
  });

  it('should preserve original error', () => {
    const original = new Error('Original');
    const result = handleDbError(original, 'test');

    expect(result.original).toBe(original);
  });
});