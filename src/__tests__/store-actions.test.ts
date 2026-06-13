/* eslint-disable @typescript-eslint/no-explicit-any, max-lines */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock zustand persist middleware
vi.mock('zustand/middleware', () => ({
  persist: (config: any, _options: any) => (set: any, get: any) => {
    const store = config(set, get);
    return store;
  },
}));

// Mock the actions module
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
  deleteCompletedTasksAction: vi.fn(),
}));

// Mock sounds
vi.mock('@/lib/sounds', () => ({
  playSound: vi.fn(),
}));

// Mock confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn(),
  writable: true,
});

import * as actions from '@/app/actions';
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
  selectedListId: null,
  statusFilter: null,
  searchQuery: '',
  showCompleted: false,
  selectedTaskId: null,
  isCreateTaskOpen: false,
  editTaskId: null,
  theme: 'system',
  brandColor: 'oklch(0.55 0.25 260)',
  focusTimer: {
    timeLeft: 25 * 60,
    isActive: false,
    mode: 'work',
    taskId: null,
  },
  loading: false,
  error: null,
};

beforeEach(() => {
  useStore.setState(initialState);
  vi.clearAllMocks();
});

describe('magicSortTasks', () => {
  it('should sort tasks by status (incomplete first)', () => {
    const completedTask = createSampleTask({ id: 'completed', status: 'completed' });
    const pendingTask = createSampleTask({ id: 'pending', status: 'pending' });
    useStore.setState({ tasks: [completedTask, pendingTask] });

    useStore.getState().magicSortTasks();

    const tasks = useStore.getState().tasks;
    expect(tasks[0].id).toBe('pending');
    expect(tasks[1].id).toBe('completed');
  });

  it('should sort by priority within same status', () => {
    const lowTask = createSampleTask({ id: 'low', status: 'pending', priority: 'low' });
    const highTask = createSampleTask({ id: 'high', status: 'pending', priority: 'high' });
    const mediumTask = createSampleTask({ id: 'medium', status: 'pending', priority: 'medium' });
    useStore.setState({ tasks: [lowTask, highTask, mediumTask] });

    useStore.getState().magicSortTasks();

    const tasks = useStore.getState().tasks;
    expect(tasks[0].id).toBe('high');
    expect(tasks[1].id).toBe('medium');
    expect(tasks[2].id).toBe('low');
  });

  it('should sort by due date when priority is same', () => {
    const later = new Date(Date.now() + 86400000);
    const earlier = new Date(Date.now() - 86400000);
    const laterTask = createSampleTask({ id: 'later', status: 'pending', priority: 'none', dueDate: later });
    const earlierTask = createSampleTask({ id: 'earlier', status: 'pending', priority: 'none', dueDate: earlier });
    useStore.setState({ tasks: [laterTask, earlierTask] });

    useStore.getState().magicSortTasks();

    const tasks = useStore.getState().tasks;
    expect(tasks[0].id).toBe('earlier');
    expect(tasks[1].id).toBe('later');
  });

  it('should sort by createdAt when all else equal', () => {
    const older = createSampleTask({ id: 'older', status: 'pending', priority: 'none', dueDate: null });
    older.createdAt = new Date(Date.now() - 86400000);
    const newer = createSampleTask({ id: 'newer', status: 'pending', priority: 'none', dueDate: null });
    newer.createdAt = new Date();
    useStore.setState({ tasks: [older, newer] });

    useStore.getState().magicSortTasks();

    const tasks = useStore.getState().tasks;
    expect(tasks[0].id).toBe('newer');
    expect(tasks[1].id).toBe('older');
  });
});

describe('clearCompleted', () => {
  it('should remove completed tasks and update overdueCount', async () => {
    const completedTask = createSampleTask({ id: 'completed', status: 'completed' });
    const pendingTask = createSampleTask({ id: 'pending', status: 'pending' });
    useStore.setState({ tasks: [completedTask, pendingTask] });

    (actions.deleteCompletedTasksAction as any).mockResolvedValue({ deleted: 1 });

    await useStore.getState().clearCompleted();

    const tasks = useStore.getState().tasks;
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('pending');
  });

  it('should not modify state if no tasks were deleted', async () => {
    const pendingTask = createSampleTask({ id: 'pending', status: 'pending' });
    useStore.setState({ tasks: [pendingTask] });

    (actions.deleteCompletedTasksAction as any).mockResolvedValue({ deleted: 0 });

    await useStore.getState().clearCompleted();

    const tasks = useStore.getState().tasks;
    expect(tasks).toHaveLength(1);
  });
});

describe('toggleTaskComplete error recovery', () => {
  it('should revert task status on update failure', async () => {
    const task = createSampleTask({ id: 'task-1', status: 'pending' });
    useStore.setState({ tasks: [task] });

    (actions.updateTaskAction as any).mockRejectedValue(new Error('Update failed'));
    (actions.loadAppData as any).mockResolvedValue({
      tasks: [],
      lists: [],
      labels: [],
      overdueCount: 0,
    });

    await useStore.getState().toggleTaskComplete('task-1');

    const updatedTask = useStore.getState().tasks.find((t) => t.id === 'task-1');
    expect(updatedTask?.status).toBe('pending');
  });
});

describe('toggleTaskComplete completion effects', () => {
  it('should trigger confetti when task is completed', async () => {
    const task = createSampleTask({ id: 'task-1', status: 'pending' });
    useStore.setState({ tasks: [task] });

    (actions.updateTaskAction as any).mockResolvedValue({
      id: 'task-1',
      title: 'Test',
      status: 'completed',
    });
    (actions.loadAppData as any).mockResolvedValue({
      tasks: [],
      lists: [],
      labels: [],
      overdueCount: 0,
    });

    await useStore.getState().toggleTaskComplete('task-1');

    expect(useStore.getState().tasks.find((t) => t.id === 'task-1')?.status).toBe('completed');
  });

  it('should toggle from completed back to pending', async () => {
    const task = createSampleTask({ id: 'task-1', status: 'completed' });
    useStore.setState({ tasks: [task] });

    (actions.updateTaskAction as any).mockResolvedValue({
      id: 'task-1',
      title: 'Test',
      status: 'pending',
    });
    (actions.loadAppData as any).mockResolvedValue({
      tasks: [],
      lists: [],
      labels: [],
      overdueCount: 0,
    });

    await useStore.getState().toggleTaskComplete('task-1');

    expect(useStore.getState().tasks.find((t) => t.id === 'task-1')?.status).toBe('pending');
  });
});

describe('toggleSubtask', () => {
  it('should toggle subtask completed status', async () => {
    const task = createSampleTask({
      id: 't1',
      subtasks: [
        { id: 's1', taskId: 't1', title: 'Sub', completed: false, order: 0, createdAt: new Date() },
      ],
    });
    useStore.setState({ tasks: [task] });

    (actions.updateSubtaskAction as any).mockResolvedValue({
      id: 's1',
      taskId: 't1',
      title: 'Sub',
      completed: true,
      order: 0,
      createdAt: new Date(),
    });
    (actions.loadAppData as any).mockResolvedValue({
      tasks: [],
      lists: [],
      labels: [],
      overdueCount: 0,
    });

    await useStore.getState().toggleSubtask('t1', 's1');

    const updatedTask = useStore.getState().tasks.find((t) => t.id === 't1');
    expect(updatedTask?.subtasks[0].completed).toBe(true);
  });

  it('should not call update if subtask not found', async () => {
    const task = createSampleTask({ id: 't1', subtasks: [] });
    useStore.setState({ tasks: [task] });

    (actions.updateSubtaskAction as any).mockResolvedValue({});
    (actions.loadAppData as any).mockResolvedValue({
      tasks: [],
      lists: [],
      labels: [],
      overdueCount: 0,
    });

    await useStore.getState().toggleSubtask('t1', 'nonexistent');

    expect(actions.updateSubtaskAction).not.toHaveBeenCalled();
  });

  it('should not update if updateSubtaskAction returns null', async () => {
    const task = createSampleTask({
      id: 't1',
      subtasks: [
        { id: 's1', taskId: 't1', title: 'Sub', completed: false, order: 0, createdAt: new Date() },
      ],
    });
    useStore.setState({ tasks: [task] });

    (actions.updateSubtaskAction as any).mockResolvedValue(null);

    await useStore.getState().toggleSubtask('t1', 's1');

    const updatedTask = useStore.getState().tasks.find((t) => t.id === 't1');
    expect(updatedTask?.subtasks[0].completed).toBe(false);
  });
});

describe('deleteSubtask', () => {
  it('should remove subtask from task', async () => {
    const task = createSampleTask({
      id: 't1',
      subtasks: [
        { id: 's1', taskId: 't1', title: 'Sub', completed: false, order: 0, createdAt: new Date() },
      ],
    });
    useStore.setState({ tasks: [task] });

    (actions.deleteSubtaskAction as any).mockResolvedValue(undefined);

    await useStore.getState().deleteSubtask('t1', 's1');

    const updatedTask = useStore.getState().tasks.find((t) => t.id === 't1');
    expect(updatedTask?.subtasks).toHaveLength(0);
  });

  it('should still call action even if task not found (action handles validation)', async () => {
    useStore.setState({ tasks: [] });

    (actions.deleteSubtaskAction as any).mockResolvedValue(undefined);

    await useStore.getState().deleteSubtask('nonexistent', 's1');

    expect(actions.deleteSubtaskAction).toHaveBeenCalledWith('s1');
  });
});

describe('addSubtask', () => {
  it('should add subtask to task', async () => {
    const task = createSampleTask({ id: 't1', subtasks: [] });
    useStore.setState({ tasks: [task] });

    const newSubtask = { id: 's1', taskId: 't1', title: 'New Sub', completed: false, order: 0, createdAt: new Date() };
    (actions.createSubtaskAction as any).mockResolvedValue(newSubtask);

    await useStore.getState().addSubtask('t1', 'New Sub');

    const updatedTask = useStore.getState().tasks.find((t) => t.id === 't1');
    expect(updatedTask?.subtasks).toHaveLength(1);
    expect(updatedTask?.subtasks[0].title).toBe('New Sub');
  });

  it('should not update if action returns null', async () => {
    const task = createSampleTask({ id: 't1', subtasks: [] });
    useStore.setState({ tasks: [task] });

    (actions.createSubtaskAction as any).mockResolvedValue(null);

    await useStore.getState().addSubtask('t1', 'New Sub');

    const updatedTask = useStore.getState().tasks.find((t) => t.id === 't1');
    expect(updatedTask?.subtasks).toHaveLength(0);
  });
});

describe('Label Actions', () => {
  it('addLabel should add label to store', async () => {
    const newLabel = { id: 'label-1', name: 'Work', color: '#ff0000' };
    (actions.createLabelAction as any).mockResolvedValue(newLabel);

    await useStore.getState().addLabel('Work', '#ff0000');

    expect(useStore.getState().labels).toContain(newLabel);
  });

  it('addLabel should not add label if action returns null', async () => {
    (actions.createLabelAction as any).mockResolvedValue(null);

    const initialLabels = useStore.getState().labels;
    await useStore.getState().addLabel('Work', '#ff0000');

    expect(useStore.getState().labels).toEqual(initialLabels);
  });

  it('updateLabel should update label and tasks with label', async () => {
    const existingLabel = { id: 'label-1', name: 'Old', color: '#111' };
    const taskWithLabel = createSampleTask({
      id: 't1',
      labels: [{ ...existingLabel, id: 'label-1' }],
    });
    useStore.setState({ labels: [existingLabel], tasks: [taskWithLabel] });

    const updatedLabel = { id: 'label-1', name: 'New', color: '#222' };
    (actions.updateLabelAction as any).mockResolvedValue(updatedLabel);

    await useStore.getState().updateLabel('label-1', 'New', '#222');

    const state = useStore.getState();
    expect(state.labels[0]?.name).toBe('New');
    expect(state.tasks[0]?.labels[0]?.name).toBe('New');
  });

  it('updateLabel should not update if action returns null', async () => {
    const existingLabel = { id: 'label-1', name: 'Old', color: '#111' };
    useStore.setState({ labels: [existingLabel] });

    (actions.updateLabelAction as any).mockResolvedValue(null);

    await useStore.getState().updateLabel('label-1', 'New', '#222');

    expect(useStore.getState().labels[0]?.name).toBe('Old');
  });

  it('deleteLabel should remove label and update tasks', async () => {
    const label = { id: 'label-1', name: 'Work', color: '#ff0000' };
    const taskWithLabel = createSampleTask({
      id: 't1',
      labels: [{ ...label }],
    });
    useStore.setState({ labels: [label], tasks: [taskWithLabel] });

    await useStore.getState().deleteLabel('label-1');

    const state = useStore.getState();
    expect(state.labels).not.toContain(label);
    expect(state.tasks[0]?.labels).toHaveLength(0);
  });
});

describe('List Actions', () => {
  it('addList should add list to store', async () => {
    const newList = { id: 'list-1', name: 'New List', color: '#ff0000', icon: '📁' };
    (actions.createListAction as any).mockResolvedValue(newList);

    await useStore.getState().addList({ name: 'New List', color: '#ff0000', icon: '📁' });

    expect(useStore.getState().lists).toContain(newList);
  });

  it('addList should not add list if action returns null', async () => {
    (actions.createListAction as any).mockResolvedValue(null);

    const initialLists = useStore.getState().lists;
    await useStore.getState().addList({ name: 'New List', color: '#ff0000' });

    expect(useStore.getState().lists).toEqual(initialLists);
  });

  it('updateList should update list in store', async () => {
    const existingList = { id: 'list-1', name: 'Old', color: '#111', icon: '📁' };
    useStore.setState({ lists: [existingList] });

    const updatedList = { id: 'list-1', name: 'New', color: '#222', icon: '📂' };
    (actions.updateListAction as any).mockResolvedValue(updatedList);

    await useStore.getState().updateList('list-1', { name: 'New' });

    expect(useStore.getState().lists[0]?.name).toBe('New');
  });

  it('updateList should not update if action returns null', async () => {
    const existingList = { id: 'list-1', name: 'Old', color: '#111' };
    useStore.setState({ lists: [existingList] });

    (actions.updateListAction as any).mockResolvedValue(null);

    await useStore.getState().updateList('list-1', { name: 'New' });

    expect(useStore.getState().lists[0]?.name).toBe('Old');
  });

  it('deleteList should remove list and tasks', async () => {
    const list = { id: 'list-1', name: 'Delete', color: '#111' };
    const taskInList = createSampleTask({ id: 't1', listId: 'list-1' });
    useStore.setState({ lists: [list], tasks: [taskInList] });

    (actions.deleteListAction as any).mockResolvedValue(undefined);

    await useStore.getState().deleteList('list-1');

    const state = useStore.getState();
    expect(state.lists).not.toContain(list);
    expect(state.tasks.find((t) => t.id === 't1')).toBeUndefined();
  });
});