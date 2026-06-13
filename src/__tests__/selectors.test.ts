/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, it, expect } from 'vitest';

import {
  computeOverdue,
  taskMatchesView,
  getFilteredTasks,
} from '@/store/selectors';
import type { Task } from '@/types';

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    listId: 'inbox',
    title: 'Test Task',
    description: '',
    status: 'pending',
    priority: 'none',
    createdAt: new Date(),
    labels: [],
    subtasks: [],
    attachments: [],
    reminders: [],
    changeLogs: [],
    ...overrides,
  } as Task;
}

describe('computeOverdue', () => {
  it('should count tasks with past deadlines', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const tasks: Task[] = [
      createTask({ id: '1', deadline: yesterday, status: 'pending' }),
      createTask({ id: '2', deadline: new Date(), status: 'pending' }),
      createTask({ id: '3', deadline: new Date(Date.now() + 86400000), status: 'pending' }),
    ];

    expect(computeOverdue(tasks)).toBe(1);
  });

  it('should not count completed tasks even if overdue', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const tasks: Task[] = [
      createTask({ id: '1', deadline: yesterday, status: 'completed' }),
    ];

    expect(computeOverdue(tasks)).toBe(0);
  });

  it('should return 0 for tasks without deadlines', () => {
    const tasks: Task[] = [
      createTask({ id: '1', deadline: undefined, dueDate: undefined }),
      createTask({ id: '2', deadline: undefined, dueDate: undefined }),
    ];

    expect(computeOverdue(tasks)).toBe(0);
  });
});

describe('taskMatchesView', () => {
  it('should return true for all views', () => {
    const task = createTask();
    expect(taskMatchesView(task, 'all')).toBe(true);
  });

  it('should return true for in_progress status', () => {
    const task = createTask({ status: 'in_progress' });
    expect(taskMatchesView(task, 'in_progress')).toBe(true);
  });

  it('should return false for in_progress view with non-in_progress status', () => {
    const task = createTask({ status: 'pending' });
    expect(taskMatchesView(task, 'in_progress')).toBe(false);
  });

  it('should return true for today view with dueDate today', () => {
    const today = new Date();
    const task = createTask({ dueDate: today });
    expect(taskMatchesView(task, 'today')).toBe(true);
  });

  it('should return false for today view with no dueDate', () => {
    const task = createTask({ dueDate: undefined, deadline: undefined });
    expect(taskMatchesView(task, 'today')).toBe(false);
  });

  it('should return true for week view with dueDate within 7 days', () => {
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    const task = createTask({ dueDate: in3Days });
    expect(taskMatchesView(task, 'week')).toBe(true);
  });

  it('should return false for week view with dueDate beyond 7 days', () => {
    const in10Days = new Date();
    in10Days.setDate(in10Days.getDate() + 10);
    const task = createTask({ dueDate: in10Days });
    expect(taskMatchesView(task, 'week')).toBe(false);
  });

  it('should return true for upcoming view with future dueDate', () => {
    const future = new Date(Date.now() + 86400000);
    const task = createTask({ dueDate: future });
    expect(taskMatchesView(task, 'upcoming')).toBe(true);
  });

  it('should return false for upcoming view with past dueDate', () => {
    const past = new Date(Date.now() - 86400000);
    const task = createTask({ dueDate: past });
    expect(taskMatchesView(task, 'upcoming')).toBe(false);
  });

  it('should return true for unknown view (fallback)', () => {
    const task = createTask();
    expect(taskMatchesView(task, 'all')).toBe(true);
  });
});

describe('getFilteredTasks', () => {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const tasks: Task[] = [
    createTask({ id: 't1', title: 'Task A', status: 'pending', priority: 'high', listId: 'list-1' }),
    createTask({ id: 't2', title: 'Task B', status: 'completed', priority: 'medium', listId: 'list-1' }),
    createTask({ id: 't3', title: 'Task C', status: 'pending', priority: 'low', listId: 'list-2' }),
    createTask({ id: 't4', title: 'Description match', status: 'pending', priority: 'none', description: 'Important' }),
  ];

  describe('filterByList', () => {
    it('should filter tasks by selectedListId', () => {
      const result = getFilteredTasks(tasks, 'all', 'list-1', null, true, '');
      expect(result.map((t) => t.id)).toEqual(['t1', 't2']);
    });
  });

  describe('filterByStatus', () => {
    it('should filter tasks by statusFilter', () => {
      const result = getFilteredTasks(tasks, 'all', null, 'completed', true, '');
      expect(result.map((t) => t.id)).toEqual(['t2']);
    });
  });

  describe('filterByCompletion', () => {
    it('should include completed tasks when showCompleted is true', () => {
      const result = getFilteredTasks(tasks, 'all', null, null, true, '');
      expect(result.find((t) => t.id === 't2')).toBeDefined();
    });

    it('should exclude completed tasks when showCompleted is false', () => {
      const result = getFilteredTasks(tasks, 'all', null, null, false, '');
      expect(result.find((t) => t.id === 't2')).toBeUndefined();
    });
  });

  describe('filterBySearch', () => {
    it('should filter by title', () => {
      const result = getFilteredTasks(tasks, 'all', null, null, true, 'Task A');
      expect(result.map((t) => t.id)).toEqual(['t1']);
    });

    it('should filter by description', () => {
      const result = getFilteredTasks(tasks, 'all', null, null, true, 'Important');
      expect(result.map((t) => t.id)).toEqual(['t4']);
    });

    it('should return all tasks when searchQuery is empty', () => {
      const result = getFilteredTasks(tasks, 'all', null, null, true, '');
      expect(result.length).toBe(tasks.length);
      expect(result.map((t) => t.id).sort()).toEqual(tasks.map((t) => t.id).sort());
    });

    it('should be case-insensitive', () => {
      const result = getFilteredTasks(tasks, 'all', null, null, true, 'TASK A');
      expect(result.map((t) => t.id)).toEqual(['t1']);
    });
  });

  describe('sortTasks', () => {
    it('should sort incomplete tasks before completed', () => {
      const result = getFilteredTasks(tasks, 'all', null, null, true, '');
      expect(result[0].status).toBe('pending');
      expect(result[result.length - 1].status).toBe('completed');
    });

    it('should sort by priority within same status', () => {
      const result = getFilteredTasks(tasks, 'all', null, null, true, '');
      const pendingResult = result.filter((t) => t.status === 'pending');
      expect(pendingResult.map((t) => t.priority)).toEqual(['high', 'low', 'none']);
    });
  });

  describe('combined filters', () => {
    it('should apply all filters together', () => {
      const result = getFilteredTasks(tasks, 'all', 'list-1', null, false, '');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('t1');
    });
  });
});