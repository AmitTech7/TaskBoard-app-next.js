"use client";

import { create } from "zustand";

import type { Task } from "../types";

/**
 * Zustand holds UI state ONLY: which dialog is open and for which task.
 * Never put server data (the tasks themselves), filters or the page number here:
 * those live in TanStack Query and in the URL.
 */
interface TaskModalState {
  isFormOpen: boolean;
  /** null = the form is creating a new task; a task = it is editing that task. */
  editingTask: Task | null;
  taskPendingDelete: Task | null;
  openCreate: () => void;
  openEdit: (task: Task) => void;
  closeForm: () => void;
  requestDelete: (task: Task) => void;
  cancelDelete: () => void;
}

export const useTaskModalStore = create<TaskModalState>((set) => ({
  isFormOpen: false,
  editingTask: null,
  taskPendingDelete: null,
  openCreate: () => set({ isFormOpen: true, editingTask: null }),
  openEdit: (task) => set({ isFormOpen: true, editingTask: task }),
  closeForm: () => set({ isFormOpen: false }),
  requestDelete: (task) => set({ taskPendingDelete: task }),
  cancelDelete: () => set({ taskPendingDelete: null }),
}));
