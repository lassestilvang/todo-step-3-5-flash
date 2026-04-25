import { z } from "zod";

export const createTaskSchema = z.object({
  listId: z.string().min(1, "List is required"),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  deadline: z.date().optional(),
  estimateMinutes: z.number().min(0).optional(),
  priority: z.enum(["none", "low", "medium", "high"]).default("none"),
  recurrence: z.enum(["daily", "weekly", "weekday", "monthly", "yearly", "custom"]).optional(),
  labelIds: z.array(z.string()).optional(),
  parentId: z.string().optional(),
});

export const updateTaskSchema = z.object({
  listId: z.string().min(1).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  deadline: z.date().optional(),
  estimateMinutes: z.number().min(0).optional(),
  priority: z.enum(["none", "low", "medium", "high"]).optional(),
  recurrence: z.enum(["daily", "weekly", "weekday", "monthly", "yearly", "custom"]).optional(),
  labelIds: z.array(z.string()).optional(),
  parentId: z.string().optional(),
});

export const createListSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  color: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, "Invalid color format"),
  icon: z.string().optional(),
  parentId: z.string().optional(),
});

export const updateListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/).optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
});

export const createLabelSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  color: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, "Invalid color format"),
  icon: z.string().optional(),
});

export const updateLabelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/).optional(),
  icon: z.string().optional(),
});

export const createSubtaskSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1, "Title is required"),
  order: z.number().optional(),
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).optional(),
  completed: z.boolean().optional(),
  order: z.number().optional(),
});
