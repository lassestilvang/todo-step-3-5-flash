/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import * as db from '@/lib/db';
import * as actions from '@/app/actions';

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

beforeEach(() => {
  clearAllTables();
  db.initializeDatabase();
  db.seedDefaultData();
});

// Helper to create a task with optional overrides
function createTask(overrides = {}): db.TaskRow {
  return db.createTask({
    list_id: 'inbox',
    title: 'Test Task',
    ...overrides,
  } as any);
}

describe('loadAppData', () => {
  describe('when view is "all"', () => {
    it('should return all tasks', async () => {
      const t1 = createTask({ title: 'Task A' });
      const t2 = createTask({ title: 'Task B' });

      const result = await actions.loadAppData({
        view: 'all',
        selectedListId: null,
        showCompleted: false,
        searchQuery: '',
      });

      expect(result.tasks.map((t) => t.id)).toContain(t1.id);
      expect(result.tasks.map((t) => t.id)).toContain(t2.id);
    });

    it('should include labels and subtasks', async () => {
      const label = db.createLabel({ name: 'TestWorkLabel123', color: '#f00' });
      const task = createTask({ title: 'With relations', label_ids: [label.id] });
      db.createSubtask({ task_id: task.id, title: 'Sub 1' });

      const result = await actions.loadAppData({
        view: 'all',
        selectedListId: null,
        showCompleted: false,
        searchQuery: '',
      });

      const fetched = result.tasks.find((t) => t.id === task.id);
      expect(fetched).toBeDefined();
      expect(fetched!.labels).toHaveLength(1);
      expect(fetched!.labels[0].name).toBe('TestWorkLabel123');
      expect(fetched!.subtasks).toHaveLength(1);
      expect(fetched!.subtasks[0].title).toBe('Sub 1');
    });

    it('should attach list info to tasks', async () => {
      const list = db.createList({ name: 'My List', color: '#0f0', icon: '📁' });
      const task = createTask({ list_id: list.id, title: 'Listed Task' });

      const result = await actions.loadAppData({
        view: 'all',
        selectedListId: null,
        showCompleted: false,
        searchQuery: '',
      });

      const fetched = result.tasks.find((t) => t.id === task.id);
      expect(fetched?.list?.name).toBe('My List');
      expect(fetched?.list?.icon).toBe('📁');
    });

    it('should calculate overdueCount correctly', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      createTask({ title: 'Overdue', deadline: yesterday, status: 'pending' });
      createTask({ title: 'Future', deadline: new Date(Date.now() + 86400000) });

      const result = await actions.loadAppData({
        view: 'all',
        selectedListId: null,
        showCompleted: false,
        searchQuery: '',
      });

      expect(result.overdueCount).toBe(1);
    });
  });

  describe('when view is "today"', () => {
    it('returns tasks due today (due_date or deadline)', async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      createTask({ title: 'Today Task', due_date: today });
      createTask({ title: 'Today Deadline', deadline: today });
      createTask({ title: 'Tomorrow Task', due_date: tomorrow });

      const result = await actions.loadAppData({
        view: 'today',
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
    it('returns tasks due within next 7 days', async () => {
      const now = new Date();
      const in3Days = new Date(now);
      in3Days.setDate(now.getDate() + 3);
      const in10Days = new Date(now);
      in10Days.setDate(now.getDate() + 10);

      createTask({ title: 'Soon', due_date: in3Days });
      createTask({ title: 'Later', due_date: in10Days });

      const result = await actions.loadAppData({
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
    it('returns tasks with future due dates (due or deadline)', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 86400000);
      const future = new Date(now.getTime() + 86400000);

      createTask({ title: 'Past', due_date: past });
      createTask({ title: 'Future', due_date: future });

      const result = await actions.loadAppData({
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
    it('filters tasks by the selected list', async () => {
      const listA = db.createList({ name: 'List A', color: '#111', icon: 'A' });
      const listB = db.createList({ name: 'List B', color: '#222', icon: 'B' });
      createTask({ list_id: listA.id, title: 'Task A' });
      createTask({ list_id: listB.id, title: 'Task B' });

      const result = await actions.loadAppData({
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
    it('excludes completed tasks', async () => {
      createTask({ title: 'Pending' });
      const completedTask = createTask({ title: 'Completed' });
      db.updateTask(completedTask.id, { status: 'completed' });

      const result = await actions.loadAppData({
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
    it('includes completed tasks', async () => {
      createTask({ title: 'Pending' });
      const completedTask = createTask({ title: 'Completed' });
      db.updateTask(completedTask.id, { status: 'completed' });

      const result = await actions.loadAppData({
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
    it('filters tasks by title case-insensitive', async () => {
      createTask({ title: 'Buy groceries' });
      createTask({ title: 'Call mom' });

      const result = await actions.loadAppData({
        view: 'all',
        selectedListId: null,
        showCompleted: false,
        searchQuery: 'buy',
      });

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].title).toBe('Buy groceries');
    });

    it('also searches description', async () => {
      createTask({ title: 'Task 1', description: 'Important meeting' });
      createTask({ title: 'Task 2', description: 'Routine checkin' });

      const result = await actions.loadAppData({
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
    it('counts only pending tasks with past deadlines', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      db.createTask({ list_id: 'inbox', title: 'Overdue 1', deadline: yesterday });
      db.createTask({ list_id: 'inbox', title: 'Overdue 2', deadline: yesterday });
      const completedOverdue = db.createTask({ list_id: 'inbox', title: 'Completed overdue', deadline: yesterday });
      db.updateTask(completedOverdue.id, { status: 'completed' });
      db.createTask({ list_id: 'inbox', title: 'Future', deadline: new Date(Date.now() + 86400000) });

      const result = await actions.loadAppData({
        view: 'all',
        selectedListId: null,
        showCompleted: false,
        searchQuery: '',
      });

      expect(result.overdueCount).toBe(2);
    });
  });
});

describe('Task Actions (proxies)', () => {
  it('createTaskAction should create a task via db', async () => {
    const result = await actions.createTaskAction({
      listId: 'inbox',
      title: 'New Task',
    } as any);

    expect(result).not.toBeNull();
    expect(result!.title).toBe('New Task');
  });

  it('updateTaskAction should update task', async () => {
    const task = db.createTask({ list_id: 'inbox', title: 'Original' });
    await actions.updateTaskAction(task.id, { title: 'Updated' });
    const updated = db.getTaskById(task.id);
    expect(updated?.title).toBe('Updated');
  });

  it('deleteTaskAction should delete task', async () => {
    const task = db.createTask({ list_id: 'inbox', title: 'Delete' });
    await actions.deleteTaskAction(task.id);
    expect(db.getTaskById(task.id)).toBeNull();
  });

  it('toggleTaskCompleteAction toggles status', async () => {
    const task = db.createTask({ list_id: 'inbox', title: 'Toggle' });
    await actions.toggleTaskCompleteAction(task.id);
    let toggled = db.getTaskById(task.id);
    expect(toggled?.status).toBe('completed');
    await actions.toggleTaskCompleteAction(task.id);
    toggled = db.getTaskById(task.id);
    expect(toggled?.status).toBe('pending');
  });

  it('createSubtaskAction creates subtask', async () => {
    const task = db.createTask({ list_id: 'inbox', title: 'Parent' });
    const subtask = await actions.createSubtaskAction(task.id, 'Subtask');
    expect(subtask).toBeDefined();
    expect(subtask.title).toBe('Subtask');
    const retrieved = db.getSubtasksByTaskId(task.id);
    expect(retrieved).toHaveLength(1);
  });

  it('updateSubtaskAction updates subtask', async () => {
    const task = db.createTask({ list_id: 'inbox', title: 'Parent' });
    const subtask = db.createSubtask({ task_id: task.id, title: 'Old' });
    await actions.updateSubtaskAction(subtask.id, { title: 'New', completed: true });
    const updated = db.getSubtasksByTaskId(task.id)[0];
    expect(updated.title).toBe('New');
    expect(updated.completed).toBe(1);
  });

  it('deleteSubtaskAction deletes subtask', async () => {
    const task = db.createTask({ list_id: 'inbox', title: 'Parent' });
    const subtask = db.createSubtask({ task_id: task.id, title: 'ToDelete' });
    await actions.deleteSubtaskAction(subtask.id);
    const remaining = db.getSubtasksByTaskId(task.id);
    expect(remaining).toHaveLength(0);
  });
});

describe('List Actions (proxies)', () => {
  it('createListAction creates list', async () => {
    const list = await actions.createListAction({ name: 'New List', color: '#000', icon: '📁' });
    expect(list).toBeDefined();
    expect(list.name).toBe('New List');
  });

  it('updateListAction updates list', async () => {
    const list = db.createList({ name: 'Old', color: '#111', icon: '📁' });
    await actions.updateListAction(list.id, { name: 'New' });
    const updated = db.getListById(list.id);
    expect(updated?.name).toBe('New');
  });

  it('deleteListAction deletes list', async () => {
    const list = db.createList({ name: 'Delete', color: '#111', icon: '🗑' });
    await actions.deleteListAction(list.id);
    expect(db.getListById(list.id)).toBeNull();
  });
});

describe('Label Actions (proxies)', () => {
  it('createLabelAction creates label', async () => {
    const labelName = 'TestLabelAction';
    const label = await actions.createLabelAction(labelName, '#ff0000', '💼');
    expect(label).toBeDefined();
    expect(label.name).toBe(labelName);
  });

  it('updateLabelAction updates label', async () => {
    const label = db.createLabel({ name: 'Old', color: '#111' });
    await actions.updateLabelAction(label.id, 'New', '#222', '⭐');
    const updated = db.getLabelById(label.id);
    expect(updated?.name).toBe('New');
    expect(updated?.color).toBe('#222');
    expect(updated?.icon).toBe('⭐');
  });

  it('deleteLabelAction deletes label', async () => {
    const label = db.createLabel({ name: 'Delete', color: '#111' });
    await actions.deleteLabelAction(label.id);
    expect(db.getLabelById(label.id)).toBeNull();
  });
});
