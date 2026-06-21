import { describe, it, expect } from 'vitest';

import { toTask, toList, toLabel } from '@/app/actions/_helpers';
import type { EnrichedTaskRow, ListRow, EnrichedLabelRow } from '@/lib/db';

describe('_helpers', () => {
  describe('toTask', () => {
    it('should convert EnrichedTaskRow to Task', () => {
      const row: EnrichedTaskRow = {
        id: 'task-1',
        list_id: 'list-1',
        parent_id: null,
        title: 'Test Task',
        description: 'Test description',
        due_date: new Date('2024-06-15'),
        deadline: new Date('2024-06-20'),
        estimate_minutes: 60,
        actual_minutes: 30,
        status: 'pending',
        priority: 'high',
        recurrence: null,
        recurrence_rule: null,
        created_at: new Date('2024-06-01'),
        updated_at: new Date('2024-06-10'),
        completed_at: undefined,
        labels: [],
        subtasks: [],
      };

      const task = toTask(row);

      expect(task.id).toBe('task-1');
      expect(task.listId).toBe('list-1');
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('Test description');
      expect(task.status).toBe('pending');
      expect(task.priority).toBe('high');
      expect(task.estimateMinutes).toBe(60);
      expect(task.actualMinutes).toBe(30);
    });

    it('should convert labels and subtasks', () => {
      const row: EnrichedTaskRow = {
        id: 'task-1',
        list_id: 'list-1',
        parent_id: null,
        title: 'Test Task',
        description: '',
        due_date: undefined,
        deadline: undefined,
        estimate_minutes: 0,
        actual_minutes: 0,
        status: 'pending',
        priority: 'none',
        recurrence: null,
        recurrence_rule: null,
        created_at: new Date(),
        updated_at: new Date(),
        completed_at: undefined,
        labels: [
          { id: 'label-1', name: 'Work', color: '#ff0000', icon: '💼', created_at: new Date() },
        ],
        subtasks: [
          { id: 'sub-1', taskId: 'task-1', title: 'Subtask', completed: true, order: 0, createdAt: new Date() },
        ],
      };

      const task = toTask(row);

      expect(task.labels).toHaveLength(1);
      expect(task.labels[0]!.name).toBe('Work');
      expect(task.subtasks).toHaveLength(1);
      expect(task.subtasks[0]!.title).toBe('Subtask');
    });

    it('should handle attachments and reminders arrays', () => {
      const row: EnrichedTaskRow = {
        id: 'task-1',
        list_id: 'list-1',
        parent_id: null,
        title: 'Test Task',
        description: '',
        due_date: undefined,
        deadline: undefined,
        estimate_minutes: 0,
        actual_minutes: 0,
        status: 'pending',
        priority: 'none',
        recurrence: null,
        recurrence_rule: null,
        created_at: new Date(),
        updated_at: new Date(),
        completed_at: undefined,
        labels: [],
        subtasks: [],
      };

      const task = toTask(row);

      expect(task.attachments).toEqual([]);
      expect(task.reminders).toEqual([]);
      expect(task.changeLogs).toEqual([]);
    });
  });

  describe('toList', () => {
    it('should convert ListRow to TaskList', () => {
      const row: ListRow = {
        id: 'list-1',
        name: 'Inbox',
        color: '#3b82f6',
        icon: '📥',
        is_magic: 1,
        parent_id: null,
        order_index: 0,
        created_at: '2024-06-01T00:00:00Z',
        updated_at: '2024-06-01T00:00:00Z',
      };

      const list = toList(row);

      expect(list.id).toBe('list-1');
      expect(list.name).toBe('Inbox');
      expect(list.color).toBe('#3b82f6');
      expect(list.icon).toBe('📥');
      expect(list.isMagic).toBe(true);
      expect(list.order).toBe(0);
    });

    it('should handle non-magic list', () => {
      const row: ListRow = {
        id: 'list-2',
        name: 'Today',
        color: '#8b5cf6',
        icon: '📅',
        is_magic: 0,
        parent_id: null,
        order_index: 1,
        created_at: '2024-06-01T00:00:00Z',
        updated_at: '2024-06-01T00:00:00Z',
      };

      const list = toList(row);

      expect(list.isMagic).toBe(false);
    });
  });

  describe('toLabel', () => {
    it('should convert EnrichedLabelRow to Label', () => {
      const row: EnrichedLabelRow = {
        id: 'label-1',
        name: 'Work',
        color: '#ef4444',
        icon: '💼',
        created_at: new Date(),
      };

      const label = toLabel(row);

      expect(label.id).toBe('label-1');
      expect(label.name).toBe('Work');
      expect(label.color).toBe('#ef4444');
      expect(label.icon).toBe('💼');
    });

    it('should handle label without icon', () => {
      const row: EnrichedLabelRow = {
        id: 'label-2',
        name: 'Personal',
        color: '#22c55e',
        icon: undefined,
        created_at: new Date(),
      };

      const label = toLabel(row);

      expect(label.icon).toBeUndefined();
    });
  });
});