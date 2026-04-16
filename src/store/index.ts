"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Task, TaskList, Label, ViewType, CreateTaskData, CreateListData } from "@/types";
import * as actions from "@/app/actions";

interface AppState {
  // Data
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
  addTask: (data: CreateTaskData) => Promise<Task | void>;
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

  // Label actions (maybe not needed directly)
  addLabel: (name: string, color: string, icon?: string) => Promise<void>;
  updateLabel: (id: string, name: string, color: string, icon?: string) => Promise<void>;
  deleteLabel: (id: string) => Promise<void>;

  // Getters
  getTaskById: (id: string) => Task | undefined;
  getFilteredTasks: () => Task[];
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      lists: [],
      labels: [],
      overdueCount: 0,
      currentView: "today",
      selectedListId: null,
      searchQuery: "",
      showCompleted: false,
      selectedTaskId: null,
      isCreateTaskOpen: false,
      editTaskId: null,
      theme: "system",

      loadData: async () => {
        try {
          const result = await actions.loadAppData({
            view: get().currentView,
            selectedListId: get().selectedListId,
            showCompleted: get().showCompleted,
            searchQuery: get().searchQuery,
          });

          set({
            tasks: result.tasks,
            lists: result.lists,
            labels: result.labels,
            overdueCount: result.overdueCount,
          });
        } catch (error) {
          console.error("Failed to load data:", error);
        }
      },

      setCurrentView: (view) => {
        set({ currentView: view, selectedListId: null });
        get().loadData();
      },

      setSelectedList: (listId) => {
        set({ selectedListId: listId });
        get().loadData();
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
        get().loadData();
      },

      toggleShowCompleted: () => {
        const newVal = !get().showCompleted;
        set({ showCompleted: newVal });
        get().loadData();
      },

      setShowCompleted: (show) => {
        set({ showCompleted: show });
        get().loadData();
      },

      setSelectedTask: (taskId) => {
        set({ selectedTaskId: taskId });
      },

      openCreateTask: (listId) => {
        set({ isCreateTaskOpen: true, editTaskId: null, selectedListId: listId ?? get().selectedListId });
      },

      openEditTask: (taskId) => {
        set({ isCreateTaskOpen: true, editTaskId: taskId });
      },

      closeTaskModal: () => {
        set({ isCreateTaskOpen: false, editTaskId: null });
      },

      addTask: async (data) => {
        const task = await actions.createTaskAction(data);
        get().loadData();
        return task as unknown as Task;
      },

      updateTask: async (id, data) => {
        await actions.updateTaskAction(id, data);
        get().loadData();
      },

      deleteTask: async (id) => {
        await actions.deleteTaskAction(id);
        get().loadData();
      },

      toggleTaskComplete: async (id) => {
        await actions.toggleTaskCompleteAction(id);
        get().loadData();
      },

      addSubtask: async (taskId, title) => {
        await actions.createSubtaskAction(taskId, title);
        get().loadData();
      },

      toggleSubtask: async (taskId, subtaskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        const subtask = task?.subtasks.find((s) => s.id === subtaskId);
        if (subtask) {
          await actions.updateSubtaskAction(subtaskId, { completed: !subtask.completed });
          get().loadData();
        }
      },

      deleteSubtask: async (taskId, subtaskId) => {
        await actions.deleteSubtaskAction(subtaskId);
        get().loadData();
      },

      addList: async (data) => {
        await actions.createListAction(data);
        get().loadData();
      },

      updateList: async (id, data) => {
        await actions.updateListAction(id, data);
        get().loadData();
      },

      deleteList: async (id) => {
        await actions.deleteListAction(id);
        get().loadData();
      },

      addLabel: async (name, color, icon) => {
        await actions.createLabelAction(name, color, icon);
        get().loadData();
      },

      updateLabel: async (id, name, color, icon) => {
        await actions.updateLabelAction(id, name, color, icon);
        get().loadData();
      },

      deleteLabel: async (id) => {
        await actions.deleteLabelAction(id);
        get().loadData();
      },

      getTaskById: (id) => {
        return get().tasks.find((t) => t.id === id);
      },

      getFilteredTasks: () => {
        return get().tasks;
      },
    }),
    {
      name: "task-planner-storage",
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);
