'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import * as actions from '@/app/actions';
import type { Task, TaskList, Label, ViewType, CreateTaskData, CreateListData } from '@/types';

interface AppState {
  // Data (full, unfiltered)
  tasks: Task[];
  lists: TaskList[];
  labels: Label[];
  overdueCount: number;

  // UI State
  currentView: ViewType;
  selectedListId: string | null;
  searchQuery: string;
  showCompleted: boolean;
  selectedTaskId: string | null;
  isCreateTaskOpen: boolean;
  editTaskId: string | null;
  theme: string;

  // Actions
  loadData: () => Promise<void>;
  setCurrentView: (view: ViewType) => void;
  setSelectedList: (listId: string | null) => void;
  setSearchQuery: (query: string) => void;
  toggleShowCompleted: () => void;
  setShowCompleted: (show: boolean) => void;
  setSelectedTask: (taskId: string | null) => void;
  openCreateTask: (listId?: string) => void;
  openEditTask: (taskId: string) => void;
  closeTaskModal: () => void;

  // Task actions
  addTask: (data: CreateTaskData) => Promise<void>;
  updateTask: (id: string, data: Partial<CreateTaskData>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;

  // List actions
  addList: (data: CreateListData) => Promise<void>;
  updateList: (id: string, data: Partial<CreateListData>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;

  // Label actions
  addLabel: (name: string, color: string, icon?: string) => Promise<void>;
  updateLabel: (id: string, name: string, color: string, icon?: string) => Promise<void>;
  deleteLabel: (id: string) => Promise<void>;

  // Getters
  getTaskById: (id: string) => Task | undefined;
  getFilteredTasks: () => Task[];
}

// Compute overdue count from tasks
function computeOverdue(tasks: Task[]): number {
  const now = new Date();
  return tasks.filter((t) => {
    if (t.status === 'completed') return false;
    const due = t.deadline || t.dueDate;
    return due ? new Date(due) < now : false;
  }).length;
}

// Check if a task matches the current view filter (client-side)
function taskMatchesView(task: Task, view: ViewType): boolean {
  // Show all tasks in "all" view regardless of dates
  if (view === 'all') return true;

  // Tasks without due date or deadline don't match any date-based view
  if (!task.dueDate && !task.deadline) return false;

  const due = task.dueDate || task.deadline!;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const weekLater = new Date(todayStart);
  weekLater.setDate(weekLater.getDate() + 7);

  switch (view) {
    case 'today':
      return due >= todayStart && due < tomorrowStart;
    case 'week':
      return due >= todayStart && due <= weekLater;
    case 'upcoming':
      return due > now;
    default:
      return true;
  }
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      lists: [],
      labels: [],
      overdueCount: 0,
      currentView: 'today',
      selectedListId: null,
      searchQuery: '',
      showCompleted: false,
      selectedTaskId: null,
      isCreateTaskOpen: false,
      editTaskId: null,
      theme: 'system',

      loadData: async () => {
        try {
          // Fetch all data without UI filters for optimistic updates
          const result = await actions.loadAppData({
            view: 'all',
            selectedListId: null,
            showCompleted: true,
            searchQuery: '',
          });
          set({
            tasks: result.tasks,
            lists: result.lists,
            labels: result.labels,
            overdueCount: result.overdueCount,
          });
        } catch (error) {
          console.error('Failed to load data:', error);
        }
      },

      setCurrentView: (view) => {
        set({ currentView: view, selectedListId: null });
      },

      setSelectedList: (listId) => {
        set({ selectedListId: listId });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      toggleShowCompleted: () => {
        set({ showCompleted: !get().showCompleted });
      },

      setShowCompleted: (show) => {
        set({ showCompleted: show });
      },

      setSelectedTask: (taskId) => {
        set({ selectedTaskId: taskId });
      },

      openCreateTask: (listId) => {
        set({
          isCreateTaskOpen: true,
          editTaskId: null,
          selectedListId: listId ?? get().selectedListId,
        });
      },

      openEditTask: (taskId) => {
        set({ isCreateTaskOpen: true, editTaskId: taskId });
      },

      closeTaskModal: () => {
        set({ isCreateTaskOpen: false, editTaskId: null });
      },

      addTask: async (data) => {
        const newTask = await actions.createTaskAction(data);
        if (newTask) {
          set((state) => {
            const tasks = [newTask, ...state.tasks];
            return { tasks, overdueCount: computeOverdue(tasks) };
          });
        }
      },

      updateTask: async (id, data) => {
        const updated = await actions.updateTaskAction(id, data);
        if (updated) {
          set((state) => {
            const tasks = state.tasks.map((t) => (t.id === id ? updated : t));
            return { tasks, overdueCount: computeOverdue(tasks) };
          });
        }
      },

      deleteTask: async (id) => {
        await actions.deleteTaskAction(id);
        set((state) => {
          const tasks = state.tasks.filter((t) => t.id !== id);
          return { tasks, overdueCount: computeOverdue(tasks) };
        });
      },

      toggleTaskComplete: async (id) => {
        const updated = await actions.toggleTaskCompleteAction(id);
        if (updated) {
          set((state) => {
            const tasks = state.tasks.map((t) => (t.id === id ? updated : t));
            return { tasks, overdueCount: computeOverdue(tasks) };
          });
        }
      },

      addSubtask: async (taskId, title) => {
        const newSubtask = await actions.createSubtaskAction(taskId, title);
        if (newSubtask) {
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === taskId ? { ...t, subtasks: [...t.subtasks, newSubtask] } : t
            ),
          }));
        }
      },

      toggleSubtask: async (taskId, subtaskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        const subtask = task?.subtasks.find((s) => s.id === subtaskId);
        if (subtask) {
          const updatedSub = await actions.updateSubtaskAction(subtaskId, {
            completed: !subtask.completed,
          });
          if (updatedSub) {
            set((state) => ({
              tasks: state.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      subtasks: t.subtasks.map((s) => (s.id === subtaskId ? updatedSub : s)),
                    }
                  : t
              ),
            }));
          }
        }
      },

      deleteSubtask: async (taskId, subtaskId) => {
        await actions.deleteSubtaskAction(subtaskId);
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) } : t
          ),
        }));
      },

      addList: async (data) => {
        const newList = await actions.createListAction(data);
        if (newList) {
          set((state) => ({
            lists: [...state.lists, newList],
          }));
        }
      },

      updateList: async (id, data) => {
        const updated = await actions.updateListAction(id, data);
        if (updated) {
          set((state) => ({
            lists: state.lists.map((l) => (l.id === id ? updated : l)),
          }));
        }
      },

      deleteList: async (id) => {
        await actions.deleteListAction(id);
        set((state) => {
          const lists = state.lists.filter((l) => l.id !== id);
          const tasks = state.tasks.filter((t) => t.listId !== id);
          return { lists, tasks, overdueCount: computeOverdue(tasks) };
        });
      },

      addLabel: async (name, color, icon) => {
        const newLabel = await actions.createLabelAction(name, color, icon);
        if (newLabel) {
          set((state) => ({
            labels: [...state.labels, newLabel],
          }));
        }
      },

      updateLabel: async (id, name, color, icon) => {
        const updated = await actions.updateLabelAction(id, name, color, icon);
        if (updated) {
          set((state) => {
            const labels = state.labels.map((l) => (l.id === id ? updated : l));
            const tasks = state.tasks.map((t) => ({
              ...t,
              labels: t.labels.map((lbl) => (lbl.id === id ? updated : lbl)),
            }));
            return { labels, tasks };
          });
        }
      },

      deleteLabel: async (id) => {
        await actions.deleteLabelAction(id);
        set((state) => {
          const labels = state.labels.filter((l) => l.id !== id);
          const tasks = state.tasks.map((t) => ({
            ...t,
            labels: t.labels.filter((l) => l.id !== id),
          }));
          return { labels, tasks };
        });
      },

      getTaskById: (id) => {
        return get().tasks.find((t) => t.id === id);
      },

      getFilteredTasks: () => {
        const state = get();
        let result = state.tasks;

        // If a list is selected, filter by list only
        if (state.selectedListId) {
          result = result.filter((t) => t.listId === state.selectedListId);
        } else {
          // Otherwise apply view-based date filtering
          result = result.filter((t) => taskMatchesView(t, state.currentView));
        }

        // Filter by completion status
        if (!state.showCompleted) {
          result = result.filter((t) => t.status !== 'completed');
        }

        // Search filter
        if (state.searchQuery.trim()) {
          const q = state.searchQuery.toLowerCase();
          result = result.filter(
            (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
          );
        }

        // Sort
        result = [...result].sort((a, b) => {
          if (a.status === 'completed' && b.status !== 'completed') return 1;
          if (a.status !== 'completed' && b.status === 'completed') return -1;
          const aDue = a.dueDate || a.deadline;
          const bDue = b.dueDate || b.deadline;
          if (!aDue && !bDue) return 0;
          if (!aDue) return 1;
          if (!bDue) return -1;
          if (aDue < bDue) return -1;
          if (aDue > bDue) return 1;
          const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        return result;
      },
    }),
    {
      name: 'task-planner-storage',
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);
