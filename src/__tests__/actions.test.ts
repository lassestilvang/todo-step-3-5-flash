import { describe, it, expect, beforeEach } from 'vitest';
import * as db from '@/lib/db';
import * as actions from '@/app/actions';
import type { Task, Label, Subtask } from '@/types';

// Helper to clear all tables before each test
function clearAllTables() {
  db.db.pragma('foreign_keys = OFF');
  const tables = [
    'task_changes',
    'reminders',
    'attachments',
    'subtasks',
    'task_labels',
    'tasks',
    'labels',
    'lists',
    'schema_migrations',
  ];
  for (const table of tables) {
    db.db.prepare(`DELETE FROM ${table}`).run();
  }
  db.db.pragma('foreign_keys = ON');
}

// Run migrations to recreate DB schema (already done on import but after delete we need schema)
function resetSchema() {
  db.initializeDatabase();
}

// Helper to create a task with optional dates
function createTaskWithDates(overrides = {}) {
  return db.createTask({
    list_id: 'inbox',
    title: 'Test Task',
    ...overrides,
  } as any);
}

beforeEach(() => {
  // Reset database schema and seed default data
  clearAllTables();
  db.initializeDatabase();
  db.seedDefaultData();
});

describe('loadAppData', () => {
  describe('when view is "all"', () => {
    it('should return all tasks', () => {
      const t1 = createTaskWithDates({ title: 'Task A' });
      const t2 = createTaskWithDates({ title: 'Task B' });

      const result = actions.loadAppData({
        view: 'all',
        selectedListId: null,
        showCompleted: false,
        searchQuery: '',
      });

      expect(result.tasks.map((t) => t.id)).toContain(t1.id);
      expect(result.tasks.map((t) => t.id)).toContain(t2.id);
    });

    it('should include labels and subtasks', () => {
      const label = db.createLabel({ name: 'Work', color: '#f00' });
      const task = createTaskWithDates({ title: 'With relations', label_ids: [label.id] });
      db.createSubtask({ task_id: task.id, title: 'Sub 1' });

      const result = actions.loadAppData({
        view: 'all',
        selectedListId: null,
        showCompleted: false,
        searchQuery: '',
      });

      const fetched = result.tasks.find((t) => t.id === task.id);
      expect(fetched).toBeDefined();
      expect(fetched!.labels).toHaveLength(1);
      expect(fetched!.labels[0].name).toBe('Work');
      expect(fetched!.subtasks).toHaveLength(1);
      expect(fetched!.subtasks[0].title).toBe('Sub 1');
    });

    it('should attach list info to tasks', () => {
      const list = db.createList({ name: 'My List', color: '#0f0', icon: '📁' });
      const task = createTaskWithDates({ list_id: list.id, title: 'Listed Task' });

      const result = actions.loadAppData({
        view: 'all',
        selectedListId: null,
        showCompleted: false,
        searchQuery: '',
      });

      const fetched = result.tasks.find((t) => t.id === task.id);
      expect(fetched?.list?.name).toBe('My List');
      expect(fetched?.list?.icon).toBe('📁');
    });

    it('should calculate overdueCount correctly', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      createTaskWithDates({ title: 'Overdue', deadline: yesterday, status: 'pending' });
      createTaskWithDates({ title: 'Future', deadline: new Date(Date.now() + 86400000) });

      const result = actions.loadAppData({
        view: 'all',
        selectedListId: null,
        showCompleted: false,
        searchQuery: '',
      });

      expect(result.overdueCount).toBe(1);
    });
  });

  describe('when view is "today"', () => {
    it('returns tasks due today (due_date or deadline)', () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      createTaskWithDates({ title: 'Today Task', due_date: today });
      createTaskWithDates({ title: 'Today Deadline', deadline: today });
      createTaskWithDates({ title: 'Tomorrow Task', due_date: tomorrow });

      const result = await actions.loadAppData({
        view: 'all',
        selectedListId: null,
        showCompleted: false,
        searchQuery: '',
      });

      const titles = result.tasks.map((t) => t.title);
      expect(titles).toContain('Today Task');
      expect(titles).toContain('Today Deadline');
      expect(titles).not.toContain('Tomorrow Task');
    });
  });

  describe('when view is "week"', () => {
    it('returns tasks due within next 7 days', () => {
      const now = new Date();
      const in3Days = new Date(now);
      in3Days.setDate(now.getDate() + 3);
      const in10Days = new Date(now);
      in10Days.setDate(now.getDate() + 10);

      createTaskWithDates({ title: 'Soon', due_date: in3Days });
      createTaskWithDates({ title: 'Later', due_date: in10Days });

      const result = actions.loadAppData({
        view: 'week',
        selectedListId: null,
        showCompleted: false,
        searchQuery: '',
      });

      const titles = result.tasks.map((t) => t.title);
      expect(titles).toContain('Soon');
      expect(titles).not.toContain('Later');
    });
  });

  describe('when view is "upcoming"', () => {
    it('returns tasks with future due dates (due or deadline)', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 86400000);
      const future = new Date(now.getTime() + 86400000);

      createTaskWithDates({ title: 'Past', due_date: past });
      createTaskWithDates({ title: 'Future', due_date: future });

      const result = actions.loadAppData({
        view: 'upcoming',
        selectedListId: null,
        showCompleted: false,
        searchQuery: '',
      });

      const titles = result.tasks.map((t) => t.title);
      expect(titles).not.toContain('Past');
      expect(titles).toContain('Future');
    });
  });

  describe('when selectedListId is provided', () => {
    it('filters tasks by the selected list', () => {
      const listA = db.createList({ name: 'List A', color: '#111', icon: 'A' });
      const listB = db.createList({ name: 'List B', color: '#222', icon: 'B' });
      createTaskWithDates({ list_id: listA.id, title: 'Task A' });
      createTaskWithDates({ list_id: listB.id, title: 'Task B' });

      const result = actions.loadAppData({
        view: 'all',
        selectedListId: listA.id,
        showCompleted: false,
        searchQuery: '',
      });

      const titles = result.tasks.map((t) => t.title);
      expect(titles).toContain('Task A');
      expect(titles).not.toContain('Task B');
    });
  });

  describe('when showCompleted is false', () => {
    it('excludes completed tasks', () => {
      const task1 = createTaskWithDates({ title: 'Pending' });
      const task2 = createTaskWithDates({ title: 'Completed', status: 'completed' as any });

      const result = actions.loadAppData({
        view: 'all',
        selectedListId: null,
        showCompleted: false,
        searchQuery: '',
      });

      const titles = result.tasks.map((t) => t.title);
      expect(titles).toContain('Pending');
      expect(titles).not.toContain('Completed');
    });
  });

  describe('when showCompleted is true', () => {
    it('includes completed tasks', () => {
      createTaskWithDates({ title: 'Pending' });
      createTaskWithDates({ title: 'Completed', status: 'completed' as any });

      const result = actions.loadAppData({
        view: 'all',
        selectedListId: null,
        showCompleted: true,
        searchQuery: '',
      });

      const titles = result.tasks.map((t) => t.title);
      expect(titles).toContain('Pending');
      expect(titles).toContain('Completed');
    });
  });

  describe('searchQuery', () => {
    it('filters tasks by title case-insensitive', () => {
      createTaskWithDates({ title: 'Buy groceries' });
      createTaskWithDates({ title: 'Call mom' });

      const result = actions.loadAppData({
        view: 'all',
        selectedListId: null,
        showCompleted: false,
        searchQuery: 'buy',
      });

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].title).toBe('Buy groceries');
    });

    it('also searches description', () => {
      createTaskWithDates({ title: 'Task 1', description: 'Important meeting' });
      createTaskWithDates({ title: 'Task 2', description: 'Routine checkin' });

      const result = actions.loadAppData({
        view: 'all',
        selectedListId: null,
        showCompleted: false,
        searchQuery: 'meeting',
      });

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].title).toBe('Task 1');
    });
  });

  describe('overdueCount', () => {
    it('counts only pending tasks with past deadlines', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      db.createTask({
        list_id: 'inbox',
        title: 'Overdue 1',
        deadline: yesterday,
        status: 'pending',
      });
      db.createTask({
        list_id: 'inbox',
        title: 'Overdue 2',
        deadline: yesterday,
        status: 'pending',
      });
      db.createTask({
        list_id: 'inbox',
        title: 'Completed overdue',
        deadline: yesterday,
        status: 'completed',
      });
      db.createTask({
        list_id: 'inbox',
        title: 'Future',
        deadline: tomorrow,
      });

      const result = actions.loadAppData({
        view: 'all',
        selectedListId: null,
        showCompleted: false,
        searchQuery: '',
      });

      expect(result.overdueCount).toBe(2);
    });
  });
});

// Other action wrappers are thin, but provide minimal coverage
describe('Task Actions (proxies)', () => {
  it('createTaskAction should create a task via db', () => {
    const result = actions.createTaskAction({
      listId: 'inbox',
      title: 'New Task',
    } as any);

    expect(result).toBeDefined();
    expect(result.title).toBe('New Task');
  });

  it('updateTaskAction should update task', () => {
    const task = db.createTask({ list_id: 'inbox', title: 'Original' });
    actions.updateTaskAction(task.id, { title: 'Updated' });
    const updated = db.getTaskById(task.id);
    expect(updated?.title).toBe('Updated');
  });

  it('deleteTaskAction should delete task', () => {
    const task = db.createTask({ list_id: 'inbox', title: 'Delete' });
    actions.deleteTaskAction(task.id);
    expect(db.getTaskById(task.id)).toBeNull();
  });

  it('toggleTaskCompleteAction toggles status', () => {
    const task = db.createTask({ list_id: 'inbox', title: 'Toggle' });
    actions.toggleTaskCompleteAction(task.id);
    const toggled = db.getTaskById(task.id);
    expect(toggled?.status).toBe('completed');
    // toggle again
    actions.toggleTaskCompleteAction(task.id);
    const again = db.getTaskById(task.id);
    expect(again?.status).toBe('pending');
  });

  it('createSubtaskAction creates subtask', () => {
    const task = db.createTask({ list_id: 'inbox', title: 'Parent' });
    const subtask = actions.createSubtaskAction(task.id, 'Subtask');
    expect(subtask).toBeDefined();
    expect(subtask.title).toBe('Subtask');
    const retrieved = db.getSubtasksByTaskId(task.id);
    expect(retrieved).toHaveLength(1);
  });

  it('updateSubtaskAction updates subtask', () => {
    const task = db.createTask({ list_id: 'inbox', title: 'Parent' });
    const subtask = db.createSubtask({ task_id: task.id, title: 'Old' });
    actions.updateSubtaskAction(subtask.id, { title: 'New', completed: true });
    const updated = db.getSubtasksByTaskId(task.id)[0];
    expect(updated.title).toBe('New');
    expect(updated.completed).toBe(1);
  });

  it('deleteSubtaskAction deletes subtask', () => {
    const task = db.createTask({ list_id: 'inbox', title: 'Parent' });
    const subtask = db.createSubtask({ task_id: task.id, title: 'ToDelete' });
    actions.deleteSubtaskAction(subtask.id);
    const remaining = db.getSubtasksByTaskId(task.id);
    expect(remaining).toHaveLength(0);
  });
});

describe('List Actions (proxies)', () => {
  it('createListAction creates list', () => {
    const list = actions.createListAction({ name: 'New List', color: '#000', icon: '📁' });
    expect(list).toBeDefined();
    expect(list.name).toBe('New List');
  });

  it('updateListAction updates list', () => {
    const list = db.createList({ name: 'Old', color: '#111', icon: '📁' });
    actions.updateListAction(list.id, { name: 'New' });
    const updated = db.getListById(list.id);
    expect(updated?.name).toBe('New');
  });

  it('deleteListAction deletes list', () => {
    const list = db.createList({ name: 'Delete', color: '#111', icon: '🗑' });
    actions.deleteListAction(list.id);
    expect(db.getListById(list.id)).toBeNull();
  });
});

describe('Label Actions (proxies)', () => {
  it('createLabelAction creates label', () => {
    const label = actions.createLabelAction('Work', '#ff0000', '💼');
    expect(label).toBeDefined();
    expect(label.name).toBe('Work');
  });

  it('updateLabelAction updates label', () => {
    const label = db.createLabel({ name: 'Old', color: '#111' });
    actions.updateLabelAction(label.id, 'New', '#222', '⭐');
    const updated = db.getLabelById(label.id);
    expect(updated?.name).toBe('New');
    expect(updated?.color).toBe('#222');
    expect(updated?.icon).toBe('⭐');
  });

  it('deleteLabelAction deletes label', () => {
    const label = db.createLabel({ name: 'Delete', color: '#111' });
    actions.deleteLabelAction(label.id);
    expect(db.getLabelById(label.id)).toBeNull();
  });
});
