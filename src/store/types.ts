import type { Task, TaskList, Label, ViewType, CreateTaskData, CreateListData } from '@/types';

export interface AppState {
  tasks: Task[];
  lists: TaskList[];
  labels: Label[];
  overdueCount: number;
  currentView: ViewType;
  selectedListId: string | null;
  searchQuery: string;
  showCompleted: boolean;
  selectedTaskId: string | null;
  isCreateTaskOpen: boolean;
  editTaskId: string | null;
  theme: string;
  brandColor: string;
  focusTimer: {
    timeLeft: number;
    isActive: boolean;
    mode: 'work' | 'break';
    taskId: string | null;
  };
  loading: boolean;
  error: string | null;
  loadData: () => Promise<void>;
  setCurrentView: (view: ViewType) => void;
  setSelectedList: (listId: string | null) => void;
  setSearchQuery: (query: string) => void;
  toggleShowCompleted: () => void;
  setShowCompleted: (show: boolean) => void;
  setSelectedTask: (taskId: string | null) => void;
  setBrandColor: (color: string) => void;
  startFocusTimer: (taskId?: string) => void;
  pauseFocusTimer: () => void;
  resetFocusTimer: () => void;
  tickFocusTimer: () => void;
  setFocusMode: (mode: 'work' | 'break') => void;
  openCreateTask: (listId?: string) => void;
  openEditTask: (taskId: string) => void;
  closeTaskModal: () => void;
  clearError: () => void;
  addTask: (data: CreateTaskData) => Promise<Task | null>;
  updateTask: (id: string, data: Partial<CreateTaskData>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  magicSortTasks: () => void;
  clearCompleted: () => Promise<void>;
  addList: (data: CreateListData) => Promise<void>;
  updateList: (id: string, data: Partial<CreateListData>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  addLabel: (name: string, color: string, icon?: string) => Promise<void>;
  updateLabel: (id: string, name: string, color: string, icon?: string) => Promise<void>;
  deleteLabel: (id: string) => Promise<void>;
  getTaskById: (id: string) => Task | undefined;
}

export type StoreSetter = (
  arg: Partial<AppState> | ((state: AppState) => Partial<AppState>)
) => void;

export type StoreGetter = () => AppState;
