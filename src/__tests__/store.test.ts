/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock zustand persist middleware to avoid localStorage issues in tests
vi.mock('zustand/middleware', () => ({
  persist: (setup: any) => setup,
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
import * as actions from '@/app/actions';
import { useStore } from '@/store';
import type { Task, TaskList, Label } from '@/types';

// Helper to create a sample task
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

function createSampleList(overrides: Partial<TaskList> = {}): TaskList {
  return {
    id: 'list-1',
    name: 'Inbox',
    color: '#3b82f6',
    icon: '📥',
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TaskList;
}

function createSampleLabel(overrides: Partial<Label> = {}): Label {
  return {
    id: 'label-1',
    name: 'Label',
    color: '#ff0000',
    createdAt: new Date(),
    ...overrides,
  } as Label;
}

const initialState = {
  tasks: [] as Task[],
  lists: [] as TaskList[],
  labels: [] as Label[],
  overdueCount: 0,
  currentView: 'today' as const,
  selectedListId: null as string | null,
  searchQuery: '',
  showCompleted: false,
  selectedTaskId: null as string | null,
  isCreateTaskOpen: false,
  editTaskId: null as string | null,
  theme: 'system',
};

beforeEach(() => {
  // Reset store state to initial
  useStore.setState(initialState);
  // Clear all mocks
  vi.clearAllMocks();
});

describe('Initial State', () => {
  it('should have correct initial values', () => {
    const state = useStore.getState();
    expect(state.tasks).toEqual([]);
    expect(state.lists).toEqual([]);
    expect(state.labels).toEqual([]);
    expect(state.overdueCount).toBe(0);
    expect(state.currentView).toBe('today');
    expect(state.selectedListId).toBeNull();
    expect(state.searchQuery).toBe('');
    expect(state.showCompleted).toBe(false);
    expect(state.selectedTaskId).toBeNull();
    expect(state.isCreateTaskOpen).toBe(false);
    expect(state.editTaskId).toBeNull();
    expect(state.theme).toBe('system');
  });
});

describe('loadData', () => {
  it('should call loadAppData with server-side parameters (ignoring UI filters)', async () => {
    (actions.loadAppData as any).mockResolvedValue({
      tasks: [],
      lists: [],
      labels: [],
      overdueCount: 0,
    });

    await useStore.getState().loadData();

    expect(actions.loadAppData).toHaveBeenCalledWith({
      view: 'all',
      selectedListId: null,
      showCompleted: true,
      searchQuery: '',
    });
  });

  it('should update state with returned data', async () => {
    const task = createSampleTask({ id: 't1' });
    const list = createSampleList({ id: 'l1' });
    const label = createSampleLabel({ id: 'lb1' });
    (actions.loadAppData as any).mockResolvedValue({
      tasks: [task],
      lists: [list],
      labels: [label],
      overdueCount: 3,
    });

    await useStore.getState().loadData();

    const state = useStore.getState();
    expect(state.tasks).toHaveLength(1);
    expect(state.lists).toHaveLength(1);
    expect(state.labels).toHaveLength(1);
    expect(state.overdueCount).toBe(3);
  });
});

describe('setCurrentView', () => {
  it('should change currentView and reset selectedListId', () => {
    useStore.getState().setCurrentView('week');
    const state = useStore.getState();
    expect(state.currentView).toBe('week');
    expect(state.selectedListId).toBeNull();
  });
});

describe('setSelectedList', () => {
  it('should set selectedListId', () => {
    useStore.getState().setSelectedList('list-123');
    const state = useStore.getState();
    expect(state.selectedListId).toBe('list-123');
  });
});

describe('setSearchQuery', () => {
  it('should update searchQuery', () => {
    useStore.getState().setSearchQuery('search term');
    expect(useStore.getState().searchQuery).toBe('search term');
  });
});

describe('toggleShowCompleted', () => {
  it('should toggle showCompleted flag', () => {
    let state = useStore.getState();
    expect(state.showCompleted).toBe(false);

    useStore.getState().toggleShowCompleted();
    state = useStore.getState();
    expect(state.showCompleted).toBe(true);

    useStore.getState().toggleShowCompleted();
    state = useStore.getState();
    expect(state.showCompleted).toBe(false);
  });

  it('should trigger loadData with toggled value', async () => {
    (actions.loadAppData as any).mockResolvedValue({
      tasks: [],
      lists: [],
      labels: [],
      overdueCount: 0,
    });

    useStore.getState().toggleShowCompleted();

    await vi.waitFor(() => {
      expect(actions.loadAppData).toHaveBeenCalledWith(
        expect.objectContaining({ showCompleted: true })
      );
    });
  });
});

describe('setShowCompleted', () => {
  it('should set showCompleted to the provided value', () => {
    useStore.getState().setShowCompleted(true);
    expect(useStore.getState().showCompleted).toBe(true);
    useStore.getState().setShowCompleted(false);
    expect(useStore.getState().showCompleted).toBe(false);
  });
});

describe('setSelectedTask', () => {
  it('should set selectedTaskId', () => {
    useStore.getState().setSelectedTask('task-123');
    expect(useStore.getState().selectedTaskId).toBe('task-123');
    useStore.getState().setSelectedTask(null);
    expect(useStore.getState().selectedTaskId).toBeNull();
  });
});

describe('openCreateTask', () => {
  it('should open create task modal with optional listId', () => {
    useStore.getState().openCreateTask('list-abc');
    let state = useStore.getState();
    expect(state.isCreateTaskOpen).toBe(true);
    expect(state.editTaskId).toBeNull();
    expect(state.selectedListId).toBe('list-abc');

    useStore.getState().closeTaskModal();
    useStore.getState().openCreateTask(); // no listId should keep current selectedListId
    state = useStore.getState();
    expect(state.isCreateTaskOpen).toBe(true);
    expect(state.selectedListId).toBe('list-abc'); // preserve previous selection
  });
});

describe('openEditTask', () => {
  it('should open edit task modal', () => {
    useStore.getState().openEditTask('task-edit-1');
    const state = useStore.getState();
    expect(state.isCreateTaskOpen).toBe(true);
    expect(state.editTaskId).toBe('task-edit-1');
  });
});

describe('closeTaskModal', () => {
  it('should close modal and clear editTaskId', () => {
    useStore.getState().openCreateTask('inbox');
    useStore.getState().closeTaskModal();
    const state = useStore.getState();
    expect(state.isCreateTaskOpen).toBe(false);
    expect(state.editTaskId).toBeNull();
  });
});

describe('Task Actions', () => {
  describe('addTask', () => {
    it('should call createTaskAction and loadData', async () => {
      const newTask = createSampleTask({ id: 'new-1', title: 'New Task' });
      (actions.createTaskAction as any).mockResolvedValue(newTask);
      (actions.loadAppData as any).mockResolvedValue({
        tasks: [newTask],
        lists: [],
        labels: [],
        overdueCount: 0,
      });

      const result = await useStore.getState().addTask({ listId: 'inbox', title: 'New Task' });

      expect(actions.createTaskAction).toHaveBeenCalledWith({
        listId: 'inbox',
        title: 'New Task',
      });
      expect(result).toBe(newTask);
      // loadData should be called (we won't await, but can check after tick)
      await vi.waitFor(() => {
        expect(actions.loadAppData).toHaveBeenCalled();
      });
    });
  });

  describe('updateTask', () => {
    it('should call updateTaskAction and loadData', async () => {
      (actions.updateTaskAction as any).mockResolvedValue({});
      (actions.loadAppData as any).mockResolvedValue({
        tasks: [],
        lists: [],
        labels: [],
        overdueCount: 0,
      });

      await useStore.getState().updateTask('task-1', { title: 'Updated' });

      expect(actions.updateTaskAction).toHaveBeenCalledWith('task-1', { title: 'Updated' });
    });
  });

  describe('deleteTask', () => {
    it('should call deleteTaskAction and loadData', async () => {
      (actions.deleteTaskAction as any).mockResolvedValue(undefined);
      (actions.loadAppData as any).mockResolvedValue({
        tasks: [],
        lists: [],
        labels: [],
        overdueCount: 0,
      });

      await useStore.getState().deleteTask('task-1');

      expect(actions.deleteTaskAction).toHaveBeenCalledWith('task-1');
    });
  });

  describe('toggleTaskComplete', () => {
    it('should call toggleTaskCompleteAction and loadData', async () => {
      (actions.toggleTaskCompleteAction as any).mockResolvedValue({});
      (actions.loadAppData as any).mockResolvedValue({
        tasks: [],
        lists: [],
        labels: [],
        overdueCount: 0,
      });

      await useStore.getState().toggleTaskComplete('task-1');

      expect(actions.toggleTaskCompleteAction).toHaveBeenCalledWith('task-1');
    });
  });

  describe('addSubtask', () => {
    it('should call createSubtaskAction and loadData', async () => {
      (actions.createSubtaskAction as any).mockResolvedValue({});
      (actions.loadAppData as any).mockResolvedValue({
        tasks: [],
        lists: [],
        labels: [],
        overdueCount: 0,
      });

      await useStore.getState().addSubtask('task-1', 'New Subtask');

      expect(actions.createSubtaskAction).toHaveBeenCalledWith('task-1', 'New Subtask');
    });
  });

  describe('toggleSubtask', () => {
    it('should call updateSubtaskAction with toggled completed value', async () => {
      const task = createSampleTask({
        id: 't1',
        subtasks: [
          {
            id: 's1',
            taskId: 't1',
            title: 'Sub',
            completed: false,
            order: 0,
            createdAt: new Date(),
          },
        ],
      });
      useStore.setState({ tasks: [task] });

      (actions.updateSubtaskAction as any).mockResolvedValue({});
      (actions.loadAppData as any).mockResolvedValue({
        tasks: [],
        lists: [],
        labels: [],
        overdueCount: 0,
      });

      await useStore.getState().toggleSubtask('t1', 's1');

      expect(actions.updateSubtaskAction).toHaveBeenCalledWith('s1', { completed: true });
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
  });

  describe('deleteSubtask', () => {
    it('should call deleteSubtaskAction and loadData', async () => {
      (actions.deleteSubtaskAction as any).mockResolvedValue(undefined);
      (actions.loadAppData as any).mockResolvedValue({
        tasks: [],
        lists: [],
        labels: [],
        overdueCount: 0,
      });

      await useStore.getState().deleteSubtask('task-1', 'sub-1');

      expect(actions.deleteSubtaskAction).toHaveBeenCalledWith('sub-1');
    });
  });
});

describe('List Actions', () => {
  describe('addList', () => {
    it('should call createListAction and loadData', async () => {
      (actions.createListAction as any).mockResolvedValue({});
      (actions.loadAppData as any).mockResolvedValue({
        tasks: [],
        lists: [],
        labels: [],
        overdueCount: 0,
      });

      await useStore.getState().addList({ name: 'New List', color: '#ff0000', icon: '📁' });

      expect(actions.createListAction).toHaveBeenCalledWith({
        name: 'New List',
        color: '#ff0000',
        icon: '📁',
      });
    });
  });

  describe('updateList', () => {
    it('should call updateListAction and loadData', async () => {
      (actions.updateListAction as any).mockResolvedValue({});
      (actions.loadAppData as any).mockResolvedValue({
        tasks: [],
        lists: [],
        labels: [],
        overdueCount: 0,
      });

      await useStore.getState().updateList('list-1', { name: 'Renamed' });

      expect(actions.updateListAction).toHaveBeenCalledWith('list-1', { name: 'Renamed' });
    });
  });

  describe('deleteList', () => {
    it('should call deleteListAction and loadData', async () => {
      (actions.deleteListAction as any).mockResolvedValue(undefined);
      (actions.loadAppData as any).mockResolvedValue({
        tasks: [],
        lists: [],
        labels: [],
        overdueCount: 0,
      });

      await useStore.getState().deleteList('list-1');

      expect(actions.deleteListAction).toHaveBeenCalledWith('list-1');
    });
  });
});

describe('Label Actions', () => {
  describe('addLabel', () => {
    it('should call createLabelAction and then loadData', async () => {
      const mockCreate = actions.createLabelAction as any;
      mockCreate.mockResolvedValue({});
      const mockLoad = actions.loadAppData as any;
      mockLoad.mockResolvedValue({ tasks: [], lists: [], labels: [], overdueCount: 0 });

      await useStore.getState().addLabel('Work', '#ff0000', '💼');

      expect(mockCreate).toHaveBeenCalledWith('Work', '#ff0000', '💼');
    });
  });

  describe('updateLabel', () => {
    it('should call updateLabelAction with id, name, color, and optional icon', async () => {
      const mockUpdate = actions.updateLabelAction as any;
      mockUpdate.mockResolvedValue({});
      const mockLoad = actions.loadAppData as any;
      mockLoad.mockResolvedValue({ tasks: [], lists: [], labels: [], overdueCount: 0 });

      await useStore.getState().updateLabel('label-1', 'New Name', '#ff0000', '⭐');

      expect(mockUpdate).toHaveBeenCalledWith('label-1', 'New Name', '#ff0000', '⭐');
    });

    it('should call updateLabelAction without icon if not provided', async () => {
      const mockUpdate = actions.updateLabelAction as any;
      mockUpdate.mockResolvedValue({});
      const mockLoad = actions.loadAppData as any;
      mockLoad.mockResolvedValue({ tasks: [], lists: [], labels: [], overdueCount: 0 });

      await useStore.getState().updateLabel('label-1', 'New Name', '#00ff00');

      expect(mockUpdate).toHaveBeenCalledWith('label-1', 'New Name', '#00ff00', undefined);
    });
  });

  describe('deleteLabel', () => {
    it('should call deleteLabelAction and then loadData', async () => {
      const mockDelete = actions.deleteLabelAction as any;
      mockDelete.mockResolvedValue(undefined);
      const mockLoad = actions.loadAppData as any;
      mockLoad.mockResolvedValue({ tasks: [], lists: [], labels: [], overdueCount: 0 });

      await useStore.getState().deleteLabel('label-1');

      expect(mockDelete).toHaveBeenCalledWith('label-1');
    });
  });
});

describe('Getters', () => {
  it('getTaskById should return the matching task', () => {
    const task = createSampleTask({ id: 't2', title: 'Task 2' });
    useStore.setState({ tasks: [task] });
    const found = useStore.getState().getTaskById('t2');
    expect(found).toEqual(task);
    expect(useStore.getState().getTaskById('missing')).toBeUndefined();
  });

  it('getFilteredTasks should return all tasks', () => {
    const t1 = createSampleTask({ id: 't1' });
    const t2 = createSampleTask({ id: 't2' });
    useStore.setState({ tasks: [t1, t2] });
    expect(useStore.getState().getFilteredTasks()).toEqual([t1, t2]);
  });
});
