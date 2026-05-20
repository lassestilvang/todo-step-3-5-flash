import * as actions from '@/app/actions';
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

    updateTask: async (id: string, data: Partial<CreateTaskData>): Promise<void> => {
      const updated = await actions.updateTaskAction(id, data);
      if (updated) {
        set((state: AppState) => {
          const tasks = state.tasks.map((t: Task) => (t.id === id ? updated : t));
          return { tasks, overdueCount: computeOverdue(tasks) };
        });
      }
    },

    deleteTask: async (id: string): Promise<void> => {
      await actions.deleteTaskAction(id);
      set((state: AppState) => {
        const tasks = state.tasks.filter((t: Task) => t.id !== id);
        return { tasks, overdueCount: computeOverdue(tasks) };
      });
    },

    toggleTaskComplete: async (id: string): Promise<void> => {
      const updated = await actions.toggleTaskCompleteAction(id);
      if (updated) {
        set((state: AppState) => {
          const tasks = state.tasks.map((t: Task) => (t.id === id ? updated : t));
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
