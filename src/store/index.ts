'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import * as actions from '@/app/actions';
import { playSound } from '@/lib/sounds';

import { createLabelActions } from './actions/labels';
import { createListActions } from './actions/lists';
import { createTaskActions } from './actions/tasks';
import type { AppState, StoreSetter, StoreGetter, FocusTimerState } from './types';

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      lists: [],
      labels: [],
      overdueCount: 0,
      currentView: 'today',
      selectedListId: null,
      statusFilter: null,
      searchQuery: '',
      showCompleted: false,
      selectedTaskId: null,
      isCreateTaskOpen: false,
      editTaskId: null,
      lastAddedTask: null,
      theme: 'system',
      brandColor: 'oklch(0.55 0.25 260)',
      focusTimer: {
        timeLeft: 25 * 60,
        isActive: false,
        mode: 'work',
        taskId: null,
        workDuration: 25 * 60,
        breakDuration: 5 * 60,
        autoStartNext: false,
      } as FocusTimerState,
      loading: false,
      error: null,
      deletedTasks: [],

      loadData: async () => {
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

      setStatusFilter: (status) => {
        set({ statusFilter: status });
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

      navigateTask: (direction) => {
        const tasks = get().tasks;
        const selectedTaskId = get().selectedTaskId;
        const currentIndex = tasks.findIndex((t) => t.id === selectedTaskId);
        const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        const nextTask = tasks[nextIndex];
        if (nextTask) {
          set({ selectedTaskId: nextTask.id });
        }
      },

      setBrandColor: (color) => {
        set({ brandColor: color });
      },

      startFocusTimer: (taskId) => {
        set((state) => ({
          focusTimer: {
            ...state.focusTimer,
            isActive: true,
            taskId: taskId ?? state.focusTimer.taskId ?? state.selectedTaskId,
          },
        }));
      },

      pauseFocusTimer: () => {
        set((state) => ({
          focusTimer: { ...state.focusTimer, isActive: false },
        }));
      },

      resetFocusTimer: () => {
        const { mode, workDuration, breakDuration } = get().focusTimer;
        const duration = mode === 'work' ? workDuration : breakDuration;
        set((state) => ({
          focusTimer: {
            ...state.focusTimer,
            isActive: false,
            timeLeft: duration,
          },
        }));
      },

      tickFocusTimer: () => {
        const { timeLeft, mode, isActive, autoStartNext, workDuration, breakDuration } = get().focusTimer;
        if (!isActive) return;

        if (timeLeft <= 0) {
          playSound('timer_end');
          try {
            navigator.vibrate([100, 50, 100]);
          } catch {
            // Vibration not supported
          }
          const nextMode = mode === 'work' ? 'break' : 'work';
          const nextDuration = nextMode === 'work' ? workDuration : breakDuration;
          const shouldAutoStart = autoStartNext && mode === 'work';

          set((state) => ({
            focusTimer: {
              ...state.focusTimer,
              isActive: shouldAutoStart,
              mode: nextMode,
              timeLeft: nextDuration,
            },
          }));

          if (shouldAutoStart) {
            setTimeout(() => {
              const { startFocusTimer } = get();
              startFocusTimer();
            }, 1000);
          }
          return;
        }

        set((state) => ({
          focusTimer: { ...state.focusTimer, timeLeft: timeLeft - 1 },
        }));
      },

      setFocusMode: (mode) => {
        const { workDuration, breakDuration } = get().focusTimer;
        const duration = mode === 'work' ? workDuration : breakDuration;
        set((state) => ({
          focusTimer: {
            ...state.focusTimer,
            mode,
            timeLeft: duration,
            isActive: false,
          },
        }));
      },

      setFocusTimerSettings: (settings) => {
        set((state) => ({
          focusTimer: { ...state.focusTimer, ...settings },
        }));
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

      undoDeleteTask: (id: string) => {
        const deletedTasks = get().deletedTasks || [];
        const deletedEntry = deletedTasks.find((d) => d.task.id === id);
        if (!deletedEntry) return;

        set((state: AppState) => ({
          tasks: [deletedEntry.task, ...state.tasks],
          deletedTasks: state.deletedTasks?.filter((d) => d.task.id !== id) || [],
        }));
      },

      clearLastAddedTask: () => {
        set({ lastAddedTask: null });
      },

      ...createTaskActions(set as StoreSetter, get as StoreGetter),
      ...createListActions(set as StoreSetter, get as StoreGetter),
      ...createLabelActions(set as StoreSetter),
    }),
    {
      name: 'task-planner-storage',
      partialize: (state) => ({
        theme: state.theme,
        brandColor: state.brandColor,
      }),
    }
  )
);
