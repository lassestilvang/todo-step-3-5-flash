import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  db,
  rowToObj,
  generateId,
  getAllLists,
  getListById,
  createList,
  updateList,
  deleteList,
  ensureInboxExists,
  getAllTasks,
  getTaskById,
  getTasksByListId,
  getOverdueTasks,
  getTasksDueToday,
  getTasksDueInNextDays,
  createTask,
  updateTask,
  deleteTask,
  getAllLabels,
  getLabelById,
  getLabelByName,
  createLabel,
  updateLabel,
  deleteLabel,
  attachLabelToTask,
  detachLabelFromTask,
  getSubtasksByTaskId,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  getAttachmentsByTaskId,
  createAttachment,
  deleteAttachment,
  getRemindersByTaskId,
  getPendingReminders,
  createReminder,
  markReminderSent,
  deleteReminder,
  seedDefaultData,
} from '@/lib/db';

// Utility to clear all tables while preserving schema
function clearAllTables() {
  // Disable foreign key constraints temporarily
  db.pragma('foreign_keys = OFF');
  // Delete from all tables in reverse dependency order
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
    db.prepare(`DELETE FROM ${table}`).run();
  }
  // Re-enable foreign key constraints
  db.pragma('foreign_keys = ON');
}

describe('Database', () => {
  beforeEach(() => {
    // Clear all data and re-seed defaults
    clearAllTables();
    seedDefaultData();
  });

  afterEach(() => {
    // No need to close db; keep connection open
  });

  describe('rowToObj', () => {
    it('should convert row to object with Date objects for _at fields', () => {
      const row = {
        id: '1',
        created_at: '2024-01-15T10:30:00.000Z',
        updated_at: '2024-01-15T11:00:00.000Z',
        due_date: '2024-02-01T00:00:00.000Z',
        some_other_field: 'value',
      };

      const obj = rowToObj(row);

      expect(obj).toBeInstanceOf(Object);
      expect(obj.created_at).toBeInstanceOf(Date);
      expect(obj.updated_at).toBeInstanceOf(Date);
      // due_date does not end with _at or contain "Date", so remains string
      expect(obj.due_date).toBe('2024-02-01T00:00:00.000Z');
      expect(obj.some_other_field).toBe('value');
    });

    it('should return null for null input', () => {
      expect(rowToObj(null)).toBeNull();
    });

    it('should handle invalid date strings', () => {
      const row = { created_at: 'not-a-date' };
      const obj = rowToObj(row);
      expect(obj.created_at).toBeNull();
    });
  });

  describe('generateId', () => {
    it('should generate a UUID string', () => {
      const id = generateId();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
      // UUID v4 format
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  // ==================== LISTS ====================
  describe('Lists', () => {
    describe('createList', () => {
      it('should create a list with provided data', () => {
        const list = createList({
          name: 'Test List',
          color: '#ff0000',
          icon: '📝',
        });

        expect(list).toBeDefined();
        expect(list.name).toBe('Test List');
        expect(list.color).toBe('#ff0000');
        expect(list.icon).toBe('📝');
      });

      it('should generate ID if not provided', () => {
        const list = createList({
          name: 'Auto ID List',
          color: '#00ff00',
          icon: '✅',
        });

        expect(list.id).toBeDefined();
        expect(list.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      });

      it('should use provided ID', () => {
        const list = createList({
          id: 'custom-id',
          name: 'Custom ID List',
          color: '#0000ff',
          icon: '🎯',
        });

        expect(list.id).toBe('custom-id');
      });

      it('should set default values', () => {
        const list = createList({
          name: 'Default List',
          color: '#3b82f6',
          icon: '📋',
        });

        expect(list.is_magic).toBe(0);
        expect(list.parent_id).toBeNull();
        expect(list.order_index).toBe(0);
      });
    });

    describe('getAllLists', () => {
      it('should return empty array when no lists', () => {
        // Remove all lists to test empty scenario
        db.prepare('DELETE FROM lists').run();
        const lists = getAllLists();
        expect(lists).toEqual([]);
      });

      it('should return all lists', () => {
        // Clear existing lists to isolate test
        db.prepare('DELETE FROM lists').run();
        createList({ name: 'List 1', color: '#111', icon: '1' });
        createList({ name: 'List 2', color: '#222', icon: '2' });

        const lists = getAllLists();

        expect(lists).toHaveLength(2);
        expect(lists.map((l) => l.name)).toContain('List 1');
        expect(lists.map((l) => l.name)).toContain('List 2');
      });

      it('should return empty array when no lists', () => {
        const lists = getAllLists();
        expect(lists).toEqual([]);
      });
    });

    describe('getListById', () => {
      it('should return list by ID', () => {
        const created = createList({ name: 'Find Me', color: '#333', icon: '🔍' });
        const found = getListById(created.id);

        expect(found).toBeDefined();
        expect(found?.name).toBe('Find Me');
      });

      it('should return null for non-existent ID', () => {
        const found = getListById('non-existent');
        expect(found).toBeNull();
      });
    });

    describe('updateList', () => {
      it('should update list fields', () => {
        const list = createList({ name: 'Original', color: '#111', icon: '🔄' });
        const updated = updateList(list.id, { name: 'Updated' });

        expect(updated?.name).toBe('Updated');
        expect(updated?.color).toBe('#111');
      });

      it('should update multiple fields', () => {
        const list = createList({ name: 'Test', color: '#111', icon: '🎨' });
        const updated = updateList(list.id, {
          name: 'New Name',
          color: '#ff00ff',
          icon: '🌈',
        });

        expect(updated?.name).toBe('New Name');
        expect(updated?.color).toBe('#ff00ff');
        expect(updated?.icon).toBe('🌈');
      });

      it('should return existing list if no updates provided', () => {
        const list = createList({ name: 'No Change', color: '#444', icon: '⏸️' });
        const updated = updateList(list.id, {});

        expect(updated?.name).toBe('No Change');
      });

      it('should return null for non-existent ID', () => {
        const updated = updateList('non-existent', { name: 'New' });
        expect(updated).toBeNull();
      });
    });

    describe('deleteList', () => {
      it('should delete a list', () => {
        const list = createList({ name: 'Delete Me', color: '#555', icon: '🗑️' });
        const result = deleteList(list.id);

        expect(result).toBe(true);
        expect(getListById(list.id)).toBeNull();
      });

      it('should return false for non-existent ID', () => {
        const result = deleteList('non-existent');
        expect(result).toBe(false);
      });
    });

    describe('ensureInboxExists', () => {
      it('should create inbox if it does not exist', () => {
        // Remove inbox if exists (from seed data)
        db.prepare('DELETE FROM lists WHERE id = "inbox"').run();
        // Confirm inbox does not exist
        expect(getListById('inbox')).toBeNull();

        ensureInboxExists();

        const inbox = getListById('inbox');
        expect(inbox).toBeDefined();
        expect(inbox?.name).toBe('Inbox');
      });

      it('should not duplicate inbox', () => {
        ensureInboxExists();
        const listsAfter = getAllLists();
        const inboxCount = listsAfter.filter((l) => l.id === 'inbox').length;
        expect(inboxCount).toBe(1);
      });

      it('should not duplicate inbox', () => {
        ensureInboxExists();
        const listsAfter = getAllLists();
        const inboxCount = listsAfter.filter((l) => l.id === 'inbox').length;
        expect(inboxCount).toBe(1);
      });
    });
  });

  // ==================== TASKS ====================
  describe('Tasks', () => {
    describe('createTask', () => {
      it('should create a task with required fields', () => {
        const task = createTask({
          list_id: 'inbox',
          title: 'Test Task',
        });

        expect(task).toBeDefined();
        expect(task.title).toBe('Test Task');
        expect(task.list_id).toBe('inbox');
        expect(task.status).toBe('pending');
        expect(task.priority).toBe('none');
        expect(task.estimate_minutes).toBe(0);
      });

      it('should create task with all optional fields', () => {
        const dueDate = new Date('2024-12-25');
        const task = createTask({
          list_id: 'inbox',
          title: 'Full Task',
          description: 'A full task',
          due_date: dueDate,
          deadline: dueDate,
          estimate_minutes: 120,
          priority: 'high',
          recurrence: 'daily',
          recurrence_rule: 'FREQ=DAILY',
        });

        expect(task.title).toBe('Full Task');
        expect(task.description).toBe('A full task');
        expect(new Date(task.due_date!).getTime()).toBe(dueDate.getTime());
        expect(task.priority).toBe('high');
        expect(task.recurrence).toBe('daily');
      });

      it('should attach labels when provided', () => {
        const label = createLabel({ name: 'Work', color: '#ff0000' });
        const task = createTask({
          list_id: 'inbox',
          title: 'Task with label',
          label_ids: [label.id],
        });

        const retrieved = getTaskById(task.id);
        expect(retrieved?.labels).toHaveLength(1);
        expect(retrieved?.labels[0].name).toBe('Work');
      });

      it('should set parent_id when provided', () => {
        const parent = createTask({ list_id: 'inbox', title: 'Parent' });
        const subtask = createTask({
          list_id: 'inbox',
          title: 'Subtask',
          parent_id: parent.id,
        });

        expect(subtask.parent_id).toBe(parent.id);
      });
    });

    describe('getAllTasks', () => {
      it('should return all tasks', () => {
        createTask({ list_id: 'inbox', title: 'Task 1' });
        createTask({ list_id: 'inbox', title: 'Task 2' });

        const tasks = getAllTasks();

        expect(tasks).toHaveLength(2);
      });
    });

    describe('getTaskById', () => {
      it('should return task with labels and subtasks', () => {
        const label = createLabel({ name: 'Test', color: '#111' });
        const task = createTask({
          list_id: 'inbox',
          title: 'Full Task',
          label_ids: [label.id],
        });
        createSubtask({ task_id: task.id, title: 'Subtask 1' });

        const retrieved = getTaskById(task.id);

        expect(retrieved).toBeDefined();
        expect(retrieved?.labels).toHaveLength(1);
        expect(retrieved?.subtasks).toHaveLength(1);
        expect(retrieved?.subtasks[0].title).toBe('Subtask 1');
      });

      it('should return null for non-existent task', () => {
        const task = getTaskById('non-existent');
        expect(task).toBeNull();
      });
    });

    describe('getTasksByListId', () => {
      it('should return tasks for specific list', () => {
        const list = createList({ name: 'Test List', color: '#666', icon: '📁' });
        createTask({ list_id: list.id, title: 'List Task 1' });
        createTask({ list_id: list.id, title: 'List Task 2' });
        createTask({ list_id: 'inbox', title: 'Inbox Task' });

        const tasks = getTasksByListId(list.id);

        expect(tasks).toHaveLength(2);
        expect(tasks.every((t) => t.list_id === list.id)).toBe(true);
      });
    });

    describe('getOverdueTasks', () => {
      it('should return tasks with past deadlines', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        createTask({
          list_id: 'inbox',
          title: 'Overdue',
          deadline: yesterday,
        });

        const overdue = getOverdueTasks();

        expect(overdue).toHaveLength(1);
        expect(overdue[0].title).toBe('Overdue');
      });

      it('should not include completed tasks', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const task = createTask({
          list_id: 'inbox',
          title: 'Completed Overdue',
          deadline: yesterday,
        });
        updateTask(task.id, { status: 'completed' });

        const overdue = getOverdueTasks();

        expect(overdue.find((t) => t.id === task.id)).toBeUndefined();
      });
    });

    describe('getTasksDueToday', () => {
      it('should return tasks due today', () => {
        const today = new Date();
        createTask({
          list_id: 'inbox',
          title: 'Today Task',
          due_date: today,
        });

        const todayTasks = getTasksDueToday();

        expect(todayTasks).toHaveLength(1);
        expect(todayTasks[0].title).toBe('Today Task');
      });

      it('should match due_date OR deadline', () => {
        const today = new Date();
        createTask({
          list_id: 'inbox',
          title: 'Due Today',
          due_date: today,
        });
        createTask({
          list_id: 'inbox',
          title: 'Deadline Today',
          deadline: today,
        });

        const todayTasks = getTasksDueToday();

        expect(todayTasks).toHaveLength(2);
      });
    });

    describe('getTasksDueInNextDays', () => {
      it('should return tasks due within specified days', () => {
        const today = new Date();
        const inThreeDays = new Date(today);
        inThreeDays.setDate(inThreeDays.getDate() + 3);
        const inTenDays = new Date(today);
        inTenDays.setDate(inTenDays.getDate() + 10);

        createTask({
          list_id: 'inbox',
          title: 'Soon',
          due_date: inThreeDays,
        });
        createTask({
          list_id: 'inbox',
          title: 'Later',
          due_date: inTenDays,
        });

        const tasks = getTasksDueInNextDays(7);

        expect(tasks).toHaveLength(1);
        expect(tasks[0].title).toBe('Soon');
      });

      it('should exclude completed tasks', () => {
        const soon = new Date();
        soon.setDate(soon.getDate() + 2);
        const task = createTask({
          list_id: 'inbox',
          title: 'Completed Soon',
          due_date: soon,
        });
        updateTask(task.id, { status: 'completed' });

        const tasks = getTasksDueInNextDays(7);

        expect(tasks).toHaveLength(0);
      });

      it('should deduplicate tasks with both due_date and deadline', () => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        createTask({
          list_id: 'inbox',
          title: 'Both Dates',
          due_date: date,
          deadline: date,
        });

        const tasks = getTasksDueInNextDays(7);

        expect(tasks).toHaveLength(1);
      });
    });

    describe('updateTask', () => {
      it('should update task fields', () => {
        const task = createTask({
          list_id: 'inbox',
          title: 'Original',
          priority: 'low',
        });

        const updated = updateTask(task.id, {
          title: 'Updated',
          priority: 'high',
        });

        expect(updated?.title).toBe('Updated');
        expect(updated?.priority).toBe('high');
      });

      it('should set completed_at when status changes to completed', () => {
        const task = createTask({
          list_id: 'inbox',
          title: 'Complete Me',
        });

        updateTask(task.id, { status: 'completed' });
        const updated = getTaskById(task.id);

        expect(updated?.status).toBe('completed');
        expect(updated?.completed_at).not.toBeNull();
      });

      it('should clear completed_at when status changes to pending', () => {
        const task = createTask({
          list_id: 'inbox',
          title: 'Uncomplete Me',
        });
        updateTask(task.id, { status: 'completed' });

        updateTask(task.id, { status: 'pending' });
        const updated = getTaskById(task.id);

        expect(updated?.status).toBe('pending');
        expect(updated?.completed_at).toBeNull();
      });

      it('should return null for non-existent task', () => {
        const updated = updateTask('non-existent', { title: 'New' });
        expect(updated).toBeNull();
      });
    });

    describe('deleteTask', () => {
      it('should delete a task', () => {
        const task = createTask({
          list_id: 'inbox',
          title: 'Delete Me',
        });

        const result = deleteTask(task.id);

        expect(result).toBe(true);
        expect(getTaskById(task.id)).toBeNull();
      });

      it('should cascade delete subtasks', () => {
        const task = createTask({ list_id: 'inbox', title: 'Parent' });
        createSubtask({ task_id: task.id, title: 'Subtask' });

        deleteTask(task.id);

        const subtasks = getSubtasksByTaskId(task.id);
        expect(subtasks).toHaveLength(0);
      });

      it('should return false for non-existent task', () => {
        const result = deleteTask('non-existent');
        expect(result).toBe(false);
      });
    });
  });

  // ==================== LABELS ====================
  describe('Labels', () => {
    describe('createLabel', () => {
      it('should create a label', () => {
        const label = createLabel({
          name: 'Important',
          color: '#ff0000',
          icon: '⭐',
        });

        expect(label).toBeDefined();
        expect(label.name).toBe('Important');
        expect(label.color).toBe('#ff0000');
        expect(label.icon).toBe('⭐');
      });

      it('should enforce unique constraint on label name', () => {
        // Use a unique name that does not exist in seed data
        const uniqueName = 'UniqueLabelTest123';

        createLabel({ name: uniqueName, color: '#111' });

        // Second insert with same name should throw UNIQUE constraint error
        expect(() => {
          createLabel({ name: uniqueName, color: '#222' });
        }).toThrow();

        // Verify only one label with that name exists
        const all = getAllLabels();
        expect(all.filter((l) => l.name === uniqueName)).toHaveLength(1);
      });
    });

    describe('getAllLabels', () => {
      it('should return all labels', () => {
        // Clear seed labels first
        db.prepare('DELETE FROM labels').run();
        createLabel({ name: 'Label 1', color: '#111' });
        createLabel({ name: 'Label 2', color: '#222' });

        const labels = getAllLabels();

        expect(labels).toHaveLength(2);
        expect(labels.map((l) => l.name)).toContain('Label 1');
        expect(labels.map((l) => l.name)).toContain('Label 2');
      });

      it('should return sorted by name', () => {
        // Clear seed labels first
        db.prepare('DELETE FROM labels').run();
        createLabel({ name: 'Zebra', color: '#111' });
        createLabel({ name: 'Apple', color: '#222' });
        createLabel({ name: 'Mango', color: '#333' });

        const labels = getAllLabels();

        expect(labels.map((l) => l.name)).toEqual(['Apple', 'Mango', 'Zebra']);
      });
    });

    describe('getLabelById', () => {
      it('should return label by ID', () => {
        const label = createLabel({ name: 'Find', color: '#444' });
        const found = getLabelById(label.id);

        expect(found?.name).toBe('Find');
      });

      it('should return null for non-existent ID', () => {
        const found = getLabelById('non-existent');
        expect(found).toBeNull();
      });
    });

    describe('getLabelByName', () => {
      it('should return label by name', () => {
        const uniqueName = 'TestLabelFind';
        createLabel({ name: uniqueName, color: '#555' });
        const found = getLabelByName(uniqueName);

        expect(found).toBeDefined();
        expect(found?.name).toBe(uniqueName);
      });

      it('should return null for non-existent name', () => {
        const found = getLabelByName('Nonexistent');
        expect(found).toBeNull();
      });
    });

    describe('updateLabel', () => {
      it('should update label fields', () => {
        const label = createLabel({ name: 'Old', color: '#666' });
        const updated = updateLabel(label.id, { name: 'New' });

        expect(updated?.name).toBe('New');
        expect(updated?.color).toBe('#666');
      });

      it('should return existing label if no updates', () => {
        const label = createLabel({ name: 'Same', color: '#777' });
        const updated = updateLabel(label.id, {});

        expect(updated?.name).toBe('Same');
      });

      it('should return null for non-existent ID', () => {
        const updated = updateLabel('non-existent', { name: 'New' });
        expect(updated).toBeNull();
      });
    });

    describe('deleteLabel', () => {
      it('should delete a label', () => {
        const label = createLabel({ name: 'Delete', color: '#888' });
        const result = deleteLabel(label.id);

        expect(result).toBe(true);
        expect(getLabelById(label.id)).toBeNull();
      });

      it('should return false for non-existent ID', () => {
        const result = deleteLabel('non-existent');
        expect(result).toBe(false);
      });
    });

    describe('attachLabelToTask / detachLabelFromTask', () => {
      it('should attach label to task', () => {
        const label = createLabel({ name: 'Test', color: '#999' });
        const task = createTask({ list_id: 'inbox', title: 'Task' });

        attachLabelToTask(task.id, label.id);

        const retrieved = getTaskById(task.id);
        expect(retrieved?.labels).toHaveLength(1);
        expect(retrieved?.labels[0].name).toBe('Test');
      });

      it('should not duplicate attachments', () => {
        const label = createLabel({ name: 'Dup', color: '#aaa' });
        const task = createTask({ list_id: 'inbox', title: 'Task' });

        attachLabelToTask(task.id, label.id);
        attachLabelToTask(task.id, label.id);

        const retrieved = getTaskById(task.id);
        expect(retrieved?.labels).toHaveLength(1);
      });

      it('should detach label from task', () => {
        const label = createLabel({ name: 'Detach', color: '#bbb' });
        const task = createTask({ list_id: 'inbox', title: 'Task' });

        attachLabelToTask(task.id, label.id);
        detachLabelFromTask(task.id, label.id);

        const retrieved = getTaskById(task.id);
        expect(retrieved?.labels).toHaveLength(0);
      });
    });
  });

  // ==================== SUBTASKS ====================
  describe('Subtasks', () => {
    let taskId: string;

    beforeEach(() => {
      const task = createTask({ list_id: 'inbox', title: 'Parent Task' });
      taskId = task.id;
    });

    describe('createSubtask', () => {
      it('should create a subtask', () => {
        const subtask = createSubtask({
          task_id: taskId,
          title: 'Subtask 1',
        });

        expect(subtask).toBeDefined();
        expect(subtask.task_id).toBe(taskId);
        expect(subtask.title).toBe('Subtask 1');
        expect(subtask.completed).toBe(0);
      });

      it('should set order based on existing subtasks', () => {
        createSubtask({ task_id: taskId, title: 'First' });
        createSubtask({ task_id: taskId, title: 'Second' });
        const third = createSubtask({ task_id: taskId, title: 'Third' });

        expect(third.order_index).toBe(2);
      });

      it('should allow custom order', () => {
        const subtask = createSubtask({
          task_id: taskId,
          title: 'Custom Order',
          order: 5,
        });

        expect(subtask.order_index).toBe(5);
      });
    });

    describe('getSubtasksByTaskId', () => {
      it('should return subtasks ordered by order_index', () => {
        createSubtask({ task_id: taskId, title: 'B', order: 1 });
        createSubtask({ task_id: taskId, title: 'A', order: 0 });
        createSubtask({ task_id: taskId, title: 'C', order: 2 });

        const subtasks = getSubtasksByTaskId(taskId);

        expect(subtasks).toHaveLength(3);
        expect(subtasks[0].title).toBe('A');
        expect(subtasks[1].title).toBe('B');
        expect(subtasks[2].title).toBe('C');
      });

      it('should return empty array for task with no subtasks', () => {
        const subtasks = getSubtasksByTaskId(taskId);
        expect(subtasks).toEqual([]);
      });
    });

    describe('updateSubtask', () => {
      it('should update subtask fields', () => {
        const subtask = createSubtask({
          task_id: taskId,
          title: 'Original',
        });

        const updated = updateSubtask(subtask.id, {
          title: 'Updated',
          completed: true,
        });

        expect(updated?.title).toBe('Updated');
        expect(updated?.completed).toBe(1);
      });

      it('should return null if no updates provided', () => {
        const subtask = createSubtask({
          task_id: taskId,
          title: 'No Change',
        });

        const result = updateSubtask(subtask.id, {});

        expect(result).toBeNull();
      });
    });

    describe('deleteSubtask', () => {
      it('should delete a subtask', () => {
        const subtask = createSubtask({
          task_id: taskId,
          title: 'Delete Me',
        });

        const result = deleteSubtask(subtask.id);

        expect(result).toBe(true);
        expect(getSubtasksByTaskId(taskId)).toHaveLength(0);
      });

      it('should return false for non-existent ID', () => {
        const result = deleteSubtask('non-existent');
        expect(result).toBe(false);
      });
    });
  });

  // ==================== ATTACHMENTS ====================
  describe('Attachments', () => {
    let taskId: string;

    beforeEach(() => {
      const task = createTask({ list_id: 'inbox', title: 'Task' });
      taskId = task.id;
    });

    describe('createAttachment', () => {
      it('should create an attachment', () => {
        const attachment = createAttachment({
          task_id: taskId,
          name: 'file.pdf',
          url: '/uploads/file.pdf',
          type: 'application/pdf',
          size: 1024,
        });

        expect(attachment).toBeDefined();
        expect(attachment.name).toBe('file.pdf');
        expect(attachment.url).toBe('/uploads/file.pdf');
        expect(attachment.size).toBe(1024);
      });
    });

    describe('getAttachmentsByTaskId', () => {
      it('should return attachments for task', () => {
        createAttachment({
          task_id: taskId,
          name: 'file1.txt',
          url: '/uploads/file1.txt',
          type: 'text/plain',
          size: 100,
        });
        createAttachment({
          task_id: taskId,
          name: 'file2.txt',
          url: '/uploads/file2.txt',
          type: 'text/plain',
          size: 200,
        });

        const attachments = getAttachmentsByTaskId(taskId);

        expect(attachments).toHaveLength(2);
      });
    });

    describe('deleteAttachment', () => {
      it('should delete an attachment', () => {
        const attachment = createAttachment({
          task_id: taskId,
          name: 'delete.txt',
          url: '/uploads/delete.txt',
          type: 'text/plain',
          size: 50,
        });

        const result = deleteAttachment(attachment.id);

        expect(result).toBe(true);
        expect(getAttachmentsByTaskId(taskId)).toHaveLength(0);
      });
    });
  });

  // ==================== REMINDERS ====================
  describe('Reminders', () => {
    let taskId: string;

    beforeEach(() => {
      const task = createTask({ list_id: 'inbox', title: 'Task' });
      taskId = task.id;
    });

    describe('createReminder', () => {
      it('should create a reminder', () => {
        const remindAt = new Date(Date.now() + 86400000);
        const reminder = createReminder({
          task_id: taskId,
          remind_at: remindAt,
        });

        expect(reminder).toBeDefined();
        expect(reminder.task_id).toBe(taskId);
        expect(reminder.sent).toBe(0);
      });
    });

    describe('getPendingReminders', () => {
      it('should return unsent reminders that are due', () => {
        const now = new Date();
        const past = new Date(now.getTime() - 60000);
        createReminder({ task_id: taskId, remind_at: past });

        const pending = getPendingReminders();

        expect(pending).toHaveLength(1);
      });

      it('should not include sent reminders', () => {
        const past = new Date(Date.now() - 60000);
        const reminder = createReminder({ task_id: taskId, remind_at: past });
        markReminderSent(reminder.id);

        const pending = getPendingReminders();

        expect(pending.find((r) => r.id === reminder.id)).toBeUndefined();
      });

      it('should not include future reminders', () => {
        const future = new Date(Date.now() + 86400000);
        createReminder({ task_id: taskId, remind_at: future });

        const pending = getPendingReminders();

        expect(pending).toHaveLength(0);
      });
    });

    describe('markReminderSent', () => {
      it('should mark reminder as sent', () => {
        const reminder = createReminder({
          task_id: taskId,
          remind_at: new Date(Date.now() - 1000),
        });

        markReminderSent(reminder.id);

        const reminders = getRemindersByTaskId(taskId);
        expect(reminders[0].sent).toBe(1);
      });
    });

    describe('deleteReminder', () => {
      it('should delete a reminder', () => {
        const reminder = createReminder({
          task_id: taskId,
          remind_at: new Date(),
        });

        const result = deleteReminder(reminder.id);

        expect(result).toBe(true);
        expect(getRemindersByTaskId(taskId)).toHaveLength(0);
      });
    });
  });

  // ==================== SEED DATA ====================
  describe('seedDefaultData', () => {
    it('should create default labels', () => {
      seedDefaultData();

      const labels = getAllLabels();
      const labelNames = labels.map((l) => l.name);

      expect(labelNames).toContain('Work');
      expect(labelNames).toContain('Personal');
      expect(labelNames).toContain('Urgent');
      expect(labelNames).toContain('Shopping');
    });

    it('should create default lists', () => {
      seedDefaultData();

      const lists = getAllLists();
      const listNames = lists.map((l) => l.name);

      expect(listNames).toContain('Today');
      expect(listNames).toContain('This Week');
      expect(listNames).toContain('Someday');
      expect(getAllLists().find((l) => l.id === 'inbox')).toBeDefined();
    });

    it('should not duplicate data on multiple calls', () => {
      seedDefaultData();
      const labels1 = getAllLabels().length;
      const lists1 = getAllLists().length;

      seedDefaultData();
      const labels2 = getAllLabels().length;
      const lists2 = getAllLists().length;

      expect(labels2).toBe(labels1);
      expect(lists2).toBe(lists1);
    });
  });
});
