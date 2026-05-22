'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import * as actions from '@/app/actions';
import { seedDefaultData } from '@/lib/db';

import { createLabelActions } from './actions/labels';
import { createListActions } from './actions/lists';
import { createTaskActions } from './actions/tasks';
import type { AppState, StoreSetter, StoreGetter } from './types';

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
      loading: false,
      error: null,

      loadData: async () => {
        seedDefaultData();
        set({ loading: true, error: null });
        try {
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
            loading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load data';
          set({ error: message, loading: false });
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

      clearError: () => {
        set({ error: null });
      },

      getTaskById: (id) => {
        return get().tasks.find((t) => t.id === id);
      },

      ...createTaskActions(set as StoreSetter, get as StoreGetter),
      ...createListActions(set as StoreSetter, get as StoreGetter),
      ...createLabelActions(set as StoreSetter),
    }),
    {
      name: 'task-planner-storage',
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);
