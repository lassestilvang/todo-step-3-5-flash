import confetti from 'canvas-confetti';

import * as actions from '@/app/actions';
import { playSound } from '@/lib/sounds';
import type { Task, CreateTaskData, Subtask } from '@/types';

import { computeOverdue } from '../selectors';
import type { StoreSetter, StoreGetter } from '../types';
import type { AppState } from '../types';

export function createTaskActions(set: StoreSetter, get: StoreGetter) {
  return {
    addTask: async (data: CreateTaskData): Promise<Task | null> => {
      const newTask = await actions.createTaskAction(data);
      if (newTask) {
        set((state: AppState) => {
          const tasks = [newTask, ...state.tasks];
          return { tasks, overdueCount: computeOverdue(tasks) };
        });
      }
      return newTask;
    },

    updateTask: async (id: string, data: Partial<CreateTaskData> & { status?: Task['status'] }): Promise<void> => {
      const updated = await actions.updateTaskAction(id, data);
      if (updated) {
        set((state: AppState) => {
          const tasks = state.tasks.map((t: Task) => (t.id === id ? updated : t));
          return { tasks, overdueCount: computeOverdue(tasks) };
        });
      }
    },

    deleteTask: async (id: string): Promise<void> => {
      const taskToDelete = get().tasks.find((t: Task) => t.id === id);
      if (!taskToDelete) return;

      await actions.deleteTaskAction(id);
      set((state: AppState) => {
        const tasks = state.tasks.filter((t: Task) => t.id !== id);
        const deletedTasks = [...(state.deletedTasks || []), { task: taskToDelete, timestamp: Date.now() }];
        return { tasks, overdueCount: computeOverdue(tasks), deletedTasks };
      });
    },

    toggleTaskComplete: async (id: string, status?: Task['status']): Promise<void> => {
      const prevTask = get().tasks.find((t: Task) => t.id === id);
      if (!prevTask) return;

      const newStatus = status ?? (prevTask.status === 'completed' ? 'pending' : 'completed');

      set((state: AppState) => {
        const tasks = state.tasks.map((t: Task) =>
          t.id === id ? ({ ...t, status: newStatus } as Task) : t
        );
        return { tasks, overdueCount: computeOverdue(tasks) };
      });

      try {
        const updated = await actions.updateTaskAction(id, { status: newStatus });
        if (updated) {
          if (updated.status === 'completed') {
            playSound('complete');
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(100);
            }
            void confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],
              zIndex: 9999,
            });
          }
          set((state: AppState) => {
            const tasks = state.tasks.map((t: Task) => (t.id === id ? updated : t));
            return { tasks, overdueCount: computeOverdue(tasks) };
          });
        }
      } catch {
        set((state: AppState) => {
          const tasks = state.tasks.map((t: Task) =>
            t.id === id ? { ...t, status: prevTask.status } : t
          );
          return { tasks, overdueCount: computeOverdue(tasks) };
        });
      }
    },

    addSubtask: async (taskId: string, title: string): Promise<void> => {
      const newSubtask = await actions.createSubtaskAction(taskId, title);
      if (newSubtask) {
        set((state: AppState) => ({
          tasks: state.tasks.map((t: Task) =>
            t.id === taskId ? { ...t, subtasks: [...t.subtasks, newSubtask] } : t
          ),
        }));
      }
    },

    toggleSubtask: async (taskId: string, subtaskId: string): Promise<void> => {
      const task = get().tasks.find((t: Task) => t.id === taskId);
      const subtask = task?.subtasks.find((s: Subtask) => s.id === subtaskId);
      if (subtask) {
        const updatedSub = await actions.updateSubtaskAction(subtaskId, {
          completed: !subtask.completed,
        });
        if (updatedSub) {
          set((state: AppState) => ({
            tasks: state.tasks.map((t: Task) =>
              t.id === taskId
                ? {
                    ...t,
                    subtasks: t.subtasks.map((s: Subtask) => (s.id === subtaskId ? updatedSub : s)),
                  }
                : t
            ),
          }));
        }
      }
    },

    deleteSubtask: async (taskId: string, subtaskId: string): Promise<void> => {
      await actions.deleteSubtaskAction(subtaskId);
      set((state: AppState) => ({
        tasks: state.tasks.map((t: Task) =>
          t.id === taskId
            ? { ...t, subtasks: t.subtasks.filter((s: Subtask) => s.id !== subtaskId) }
            : t
        ),
      }));
    },

    magicSortTasks: () => {
      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };
      
      set((state: AppState) => {
        const sortedTasks = [...state.tasks].sort((a, b) => {
          // 1. Status (incomplete first)
          if (a.status !== b.status) {
            return a.status === 'completed' ? 1 : -1;
          }
          
          // 2. Priority
          if (a.priority !== b.priority) {
            return priorityOrder[a.priority]! - priorityOrder[b.priority]!;
          }
          
          // 3. Due Date
          const dateA = a.dueDate || a.deadline;
          const dateB = b.dueDate || b.deadline;
          if (dateA && dateB) {
            return new Date(dateA).getTime() - new Date(dateB).getTime();
          }
          if (dateA) return -1;
          if (dateB) return 1;
          
          // 4. Creation Date (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        return { tasks: sortedTasks };
      });
      
      void confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.8 },
        colors: ['#3b82f6', '#8b5cf6'],
      });
    },

    clearCompleted: async (): Promise<void> => {
      const { deleted } = await actions.deleteCompletedTasksAction();
      if (deleted > 0) {
        set((state: AppState) => ({
          tasks: state.tasks.filter((t: Task) => t.status !== 'completed'),
          overdueCount: computeOverdue(state.tasks.filter((t: Task) => t.status !== 'completed')),
        }));
      }
    },
  };
}
