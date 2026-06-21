import { describe, it, expect } from 'vitest';

import { AppError, isAppError } from '@/lib/errors';

describe('errors', () => {
  describe('AppError', () => {
    it('should create an error with message, code, and original', () => {
      const original = new Error('Original error');
      const error = new AppError('Test message', 'NOT_FOUND', original);

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.original).toBe(original);
      expect(error.name).toBe('AppError');
    });

    it('should work without original error', () => {
      const error = new AppError('Test message', 'CONSTRAINT');

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('CONSTRAINT');
      expect(error.original).toBeUndefined();
    });

    it('should accept all error codes', () => {
      const codes: Array<'NOT_FOUND' | 'CONSTRAINT' | 'VALIDATION' | 'INTERNAL'> = [
        'NOT_FOUND',
        'CONSTRAINT',
        'VALIDATION',
        'INTERNAL',
      ];

      codes.forEach((code) => {
        const error = new AppError('Test', code);
        expect(error.code).toBe(code);
      });
    });
  });

  describe('isAppError', () => {
    it('should return true for AppError instances', () => {
      const error = new AppError('Test', 'NOT_FOUND');
      expect(isAppError(error)).toBe(true);
    });

    it('should return false for regular Error instances', () => {
      const error = new Error('Test');
      expect(isAppError(error)).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
      expect(isAppError('string')).toBe(false);
      expect(isAppError(123)).toBe(false);
      expect(isAppError({})).toBe(false);
    });
  });
});