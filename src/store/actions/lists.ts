import * as actions from '@/app/actions';
import type { Task, TaskList, CreateListData } from '@/types';

import { computeOverdue } from '../selectors';
import type { StoreSetter, StoreGetter } from '../types';
import type { AppState } from '../types';

export function createListActions(set: StoreSetter, get: StoreGetter) {
  return {
    addList: async (data: CreateListData): Promise<void> => {
      const newList = await actions.createListAction(data);
      if (newList) {
        set((state: AppState) => ({
          lists: [...state.lists, newList],
        }));
      }
    },

    updateList: async (id: string, data: Partial<CreateListData>): Promise<void> => {
      const updated = await actions.updateListAction(id, data);
      if (updated) {
        set((state: AppState) => ({
          lists: state.lists.map((l: TaskList) => (l.id === id ? updated : l)),
        }));
      }
    },

    deleteList: async (id: string): Promise<void> => {
      await actions.deleteListAction(id);
      set((state: AppState) => {
        const lists = state.lists.filter((l: TaskList) => l.id !== id);
        const tasks = state.tasks.filter((t: Task) => t.listId !== id);
        return { lists, tasks, overdueCount: computeOverdue(tasks) };
      });
    },
  };
}
