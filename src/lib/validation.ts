import { z } from 'zod';

import { PRIORITY_VALUES, RECURRENCE_VALUES } from '@/constants';

const taskCommonFields = {
  listId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  deadline: z.date().optional(),
  estimateMinutes: z.number().min(0).optional(),
  priority: z.enum(PRIORITY_VALUES).default('none'),
  recurrence: z.enum(RECURRENCE_VALUES).optional(),
  labelIds: z.array(z.string()).optional(),
  parentId: z.string().optional(),
};

// Cross-field validation: deadline must be >= dueDate if both present
function deadlineAfterDueDate(data: unknown): boolean {
  const d = data as { dueDate?: Date; deadline?: Date };
  if (d.dueDate && d.deadline) {
    return d.deadline >= d.dueDate;
  }
  return true;
}

export const createTaskSchema = z
  .object({
    ...taskCommonFields,
    listId: z.string().min(1, 'List is required'),
    title: z.string().min(1, 'Title is required').max(200),
  })
  .refine(deadlineAfterDueDate, {
    message: 'Deadline cannot be earlier than due date',
    path: ['deadline'],
  });

export const updateTaskSchema = z
  .object({
    ...taskCommonFields,
    listId: z.string().min(1).optional(),
    title: z.string().min(1).max(200).optional(),
    status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  })
  .partial()
  .refine(deadlineAfterDueDate, {
    message: 'Deadline cannot be earlier than due date',
    path: ['deadline'],
  });

export const createListSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  color: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, 'Invalid color format'),
  icon: z.string().optional(),
  parentId: z.string().optional(),
});

export const updateListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}){1,2}$/)
    .optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
});

export const createLabelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  color: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, 'Invalid color format'),
  icon: z.string().optional(),
});

export const updateLabelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}){1,2}$/)
    .optional(),
  icon: z.string().optional(),
});

export const createSubtaskSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1, 'Title is required'),
  order: z.number().optional(),
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).optional(),
  completed: z.boolean().optional(),
  order: z.number().optional(),
});
