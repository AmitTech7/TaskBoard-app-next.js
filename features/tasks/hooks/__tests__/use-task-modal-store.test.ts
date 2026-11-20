import { act } from "@testing-library/react";

import type { Task } from "../../types";
import { useTaskModalStore } from "../use-task-modal-store";

const INITIAL_STATE = useTaskModalStore.getState();
const FIRST_TASK: Task = { id: 1, title: "Buy milk", status: "pending", userId: 10 };
const SECOND_TASK: Task = { id: 2, title: "Learn Next.js", status: "completed", userId: 10 };

beforeEach(() => {
  // The store is shared by every test in this file, so put it back to its starting state.
  useTaskModalStore.setState(INITIAL_STATE, true);
});

describe("useTaskModalStore", () => {
  it("starts with everything closed", () => {
    expect(useTaskModalStore.getState()).toMatchObject({
      isFormOpen: false,
      editingTask: null,
      taskPendingDelete: null,
    });
  });

  it("openCreate opens the form with no task (create mode)", () => {
    act(() => {
      useTaskModalStore.getState().openCreate();
    });

    expect(useTaskModalStore.getState()).toMatchObject({ isFormOpen: true, editingTask: null });
  });

  it("openCreate clears a task left over from an earlier edit", () => {
    act(() => {
      useTaskModalStore.getState().openEdit(FIRST_TASK);
      useTaskModalStore.getState().closeForm();
      useTaskModalStore.getState().openCreate();
    });

    expect(useTaskModalStore.getState().editingTask).toBeNull();
  });

  it("openEdit opens the form for that task (edit mode)", () => {
    act(() => {
      useTaskModalStore.getState().openEdit(SECOND_TASK);
    });

    expect(useTaskModalStore.getState()).toMatchObject({
      isFormOpen: true,
      editingTask: SECOND_TASK,
    });
  });

  it("closeForm closes the form", () => {
    act(() => {
      useTaskModalStore.getState().openEdit(FIRST_TASK);
      useTaskModalStore.getState().closeForm();
    });

    expect(useTaskModalStore.getState().isFormOpen).toBe(false);
  });

  it("requestDelete remembers which task is waiting for confirmation", () => {
    act(() => {
      useTaskModalStore.getState().requestDelete(FIRST_TASK);
    });

    expect(useTaskModalStore.getState().taskPendingDelete).toEqual(FIRST_TASK);
  });

  it("cancelDelete forgets it", () => {
    act(() => {
      useTaskModalStore.getState().requestDelete(FIRST_TASK);
      useTaskModalStore.getState().cancelDelete();
    });

    expect(useTaskModalStore.getState().taskPendingDelete).toBeNull();
  });

  it("keeps the form and the delete dialog independent", () => {
    act(() => {
      useTaskModalStore.getState().openEdit(FIRST_TASK);
      useTaskModalStore.getState().requestDelete(SECOND_TASK);
    });

    expect(useTaskModalStore.getState()).toMatchObject({
      isFormOpen: true,
      editingTask: FIRST_TASK,
      taskPendingDelete: SECOND_TASK,
    });
  });
});
