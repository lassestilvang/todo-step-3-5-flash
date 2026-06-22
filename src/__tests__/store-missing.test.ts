/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock zustand persist middleware
vi.mock('zustand/middleware', () => ({
  persist: (config: any) => (set: any, get: any) => {
    const store = config(set, get);
    return store;
  },
}));

// Mock the actions module before store is imported
vi.mock('@/app/actions', () => ({
  loadAppData: vi.fn(),
  createTaskAction: vi.fn(),
  updateTaskAction: vi.fn(),
  deleteTaskAction: vi.fn(),
  toggleTaskCompleteAction: vi.fn(),
  createSubtaskAction: vi.fn(),
  updateSubtaskAction: vi.fn(),
  deleteSubtaskAction: vi.fn(),
  createListAction: vi.fn(),
  updateListAction: vi.fn(),
  deleteListAction: vi.fn(),
  createLabelAction: vi.fn(),
  updateLabelAction: vi.fn(),
  deleteLabelAction: vi.fn(),
}));

// Import after mocks are set up
import { useStore } from '@/store';
import type { Task } from '@/types';

function createSampleTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    listId: 'inbox',
    title: 'Sample Task',
    description: '',
    status: 'pending',
    priority: 'none',
    createdAt: new Date(),
    updatedAt: new Date(),
    labels: [],
    subtasks: [],
    attachments: [],
    reminders: [],
    changeLogs: [],
    ...overrides,
  } as Task;
}

const initialState = {
  tasks: [] as Task[],
  lists: [],
  labels: [],
  overdueCount: 0,
  currentView: 'today' as const,
  selectedListId: null as string | null,
  statusFilter: null as Task['status'] | null,
  searchQuery: '',
  showCompleted: false,
  selectedTaskId: null as string | null,
  isCreateTaskOpen: false,
  editTaskId: null as string | null,
  lastAddedTask: null as string | null,
  theme: 'system',
  brandColor: 'oklch(0.55 0.25 260)',
  focusTimer: {
    timeLeft: 25 * 60,
    isActive: false,
    mode: 'work' as const,
    taskId: null,
    workDuration: 25 * 60,
    breakDuration: 5 * 60,
    autoStartNext: false,
  },
  loading: false,
  error: null,
  deletedTasks: [],
};

beforeEach(() => {
  useStore.setState(initialState);
  vi.clearAllMocks();
});

describe('Store - additional coverage', () => {
  describe('navigateTask', () => {
    it('should navigate to next task', () => {
      const task1 = createSampleTask({ id: 't1' });
      const task2 = createSampleTask({ id: 't2' });
      useStore.setState({ tasks: [task1, task2], selectedTaskId: 't1' });

      useStore.getState().navigateTask('next');

      expect(useStore.getState().selectedTaskId).toBe('t2');
    });

    it('should navigate to previous task', () => {
      const task1 = createSampleTask({ id: 't1' });
      const task2 = createSampleTask({ id: 't2' });
      useStore.setState({ tasks: [task1, task2], selectedTaskId: 't2' });

      useStore.getState().navigateTask('previous');

      expect(useStore.getState().selectedTaskId).toBe('t1');
    });

    it('should not navigate beyond last task', () => {
      const task1 = createSampleTask({ id: 't1' });
      useStore.setState({ tasks: [task1], selectedTaskId: 't1' });

      useStore.getState().navigateTask('next');

      expect(useStore.getState().selectedTaskId).toBe('t1');
    });

    it('should not navigate before first task', () => {
      const task1 = createSampleTask({ id: 't1' });
      useStore.setState({ tasks: [task1], selectedTaskId: 't1' });

      useStore.getState().navigateTask('previous');

      expect(useStore.getState().selectedTaskId).toBe('t1');
    });

    it('should handle null selectedTaskId', () => {
      const task1 = createSampleTask({ id: 't1' });
      useStore.setState({ tasks: [task1] });

      useStore.getState().navigateTask('next');

      // When there's no selectedTaskId, navigateTask finds the first task and navigates to it
      expect(useStore.getState().selectedTaskId).toBe('t1');
    });
  });

  describe('getTaskById', () => {
    it('should return the matching task', () => {
      const task = createSampleTask({ id: 't2' });
      useStore.setState({ tasks: [task] });

      const found = useStore.getState().getTaskById('t2');

      expect(found).toEqual(task);
    });

    it('should return undefined for non-existent task', () => {
      useStore.setState({ tasks: [] });

      const found = useStore.getState().getTaskById('nonexistent');

      expect(found).toBeUndefined();
    });
  });

  describe('clearLastAddedTask', () => {
    it('should clear the lastAddedTask', () => {
      useStore.setState({ lastAddedTask: 'task-123' });

      useStore.getState().clearLastAddedTask();

      expect(useStore.getState().lastAddedTask).toBeNull();
    });
  });

  describe('theme and brandColor', () => {
    it('should have default theme and brandColor', () => {
      const state = useStore.getState();
      expect(state.theme).toBe('system');
      expect(state.brandColor).toBe('oklch(0.55 0.25 260)');
    });
  });

  describe('loading state', () => {
    it('should have loading state', () => {
      const state = useStore.getState();
      expect(state.loading).toBe(false);
    });
  });

  describe('focusTimer task fallback', () => {
    it('should fallback to selectedTaskId when taskId is null', () => {
      useStore.setState({ selectedTaskId: 'task-456' });

      useStore.getState().startFocusTimer(null as any);

      expect(useStore.getState().focusTimer.taskId).toBe('task-456');
    });
  });
});
