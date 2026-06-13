import { describe, it, expect } from 'vitest';

import {
  createTaskSchema,
  updateTaskSchema,
  createListSchema,
  updateListSchema,
  createLabelSchema,
  updateLabelSchema,
  createSubtaskSchema,
  updateSubtaskSchema,
} from '@/lib/validation';

describe('validation', () => {
  describe('createTaskSchema', () => {
    it('should validate a valid task', () => {
      const result = createTaskSchema.safeParse({
        listId: 'list-1',
        title: 'Test Task',
      });
      expect(result.success).toBe(true);
    });

    it('should require title', () => {
      const result = createTaskSchema.safeParse({ listId: 'list-1' });
      expect(result.success).toBe(false);
    });

    it('should require title max 200 chars', () => {
      const result = createTaskSchema.safeParse({
        listId: 'list-1',
        title: 'a'.repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it('should validate deadline after dueDate', () => {
      const dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + 1);
      const result = createTaskSchema.safeParse({
        listId: 'list-1',
        title: 'Test',
        dueDate,
        deadline: new Date(dueDate.getTime() - 1000000), // before dueDate
      });
      expect(result.success).toBe(false);
    });

    it('should allow deadline equal to dueDate', () => {
      const date = new Date();
      const result = createTaskSchema.safeParse({
        listId: 'list-1',
        title: 'Test',
        dueDate: date,
        deadline: date,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateTaskSchema', () => {
    it('should validate partial updates', () => {
      const result = updateTaskSchema.safeParse({ title: 'Updated' });
      expect(result.success).toBe(true);
    });

    it('should validate status values', () => {
      const result = updateTaskSchema.safeParse({ status: 'in_progress' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = updateTaskSchema.safeParse({ status: 'invalid' as any });
      expect(result.success).toBe(false);
    });
  });

  describe('createListSchema', () => {
    it('should validate a valid list', () => {
      const result = createListSchema.safeParse({
        name: 'My List',
        color: '#ff0000',
      });
      expect(result.success).toBe(true);
    });

    it('should require name', () => {
      const result = createListSchema.safeParse({ color: '#ff0000' });
      expect(result.success).toBe(false);
    });

    it('should require valid hex color', () => {
      const result = createListSchema.safeParse({ name: 'Test', color: 'red' });
      expect(result.success).toBe(false);
    });

    it('should accept 3-digit hex color', () => {
      const result = createListSchema.safeParse({ name: 'Test', color: '#f00' });
      expect(result.success).toBe(true);
    });
  });

  describe('updateListSchema', () => {
    it('should allow partial updates', () => {
      const result = updateListSchema.safeParse({ name: 'Updated' });
      expect(result.success).toBe(true);
    });

    it('should require valid color if provided', () => {
      const result = updateListSchema.safeParse({ color: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('createLabelSchema', () => {
    it('should validate a valid label', () => {
      const result = createLabelSchema.safeParse({
        name: 'Work',
        color: '#3b82f6',
      });
      expect(result.success).toBe(true);
    });

    it('should require name', () => {
      const result = createLabelSchema.safeParse({ color: '#3b82f6' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateLabelSchema', () => {
    it('should allow partial updates', () => {
      const result = updateLabelSchema.safeParse({ name: 'Updated' });
      expect(result.success).toBe(true);
    });
  });

  describe('createSubtaskSchema', () => {
    it('should validate a valid subtask', () => {
      const result = createSubtaskSchema.safeParse({
        taskId: 'task-1',
        title: 'Subtask',
      });
      expect(result.success).toBe(true);
    });

    it('should require taskId and title', () => {
      const result = createSubtaskSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('updateSubtaskSchema', () => {
    it('should allow partial updates', () => {
      const result = updateSubtaskSchema.safeParse({ completed: true });
      expect(result.success).toBe(true);
    });
  });
});