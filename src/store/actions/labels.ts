import * as actions from '@/app/actions';
import type { Task, Label } from '@/types';

import type { StoreSetter } from '../types';
import type { AppState } from '../types';

export function createLabelActions(set: StoreSetter) {
  return {
    addLabel: async (name: string, color: string, icon?: string): Promise<void> => {
      const newLabel = await actions.createLabelAction(name, color, icon);
      if (newLabel) {
        set((state: AppState) => ({
          labels: [...state.labels, newLabel],
        }));
      }
    },

    updateLabel: async (id: string, name: string, color: string, icon?: string): Promise<void> => {
      const updated = await actions.updateLabelAction(id, name, color, icon);
      if (updated) {
        set((state: AppState) => {
          const labels = state.labels.map((l: Label) => (l.id === id ? updated : l));
          const tasks = state.tasks.map((t: Task) => ({
            ...t,
            labels: t.labels.map((lbl: Label) => (lbl.id === id ? updated : lbl)),
          }));
          return { labels, tasks };
        });
      }
    },

    deleteLabel: async (id: string): Promise<void> => {
      await actions.deleteLabelAction(id);
      set((state: AppState) => {
        const labels = state.labels.filter((l: Label) => l.id !== id);
        const tasks = state.tasks.map((t: Task) => ({
          ...t,
          labels: t.labels.filter((l: Label) => l.id !== id),
        }));
        return { labels, tasks };
      });
    },
  };
}
