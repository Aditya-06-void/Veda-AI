"use client";

import { create } from "zustand";

import {
  createAssignment,
  fetchAssignments,
  generateAssignment,
  regenerateAssignment,
} from "@/lib/api";
import { socket } from "@/lib/socket";
import { Assignment, AssignmentFormValues } from "@/lib/types";

type ViewMode = "list" | "create" | "output";

type AssignmentStore = {
  assignments: Assignment[];
  activeAssignmentId: string | null;
  view: ViewMode;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  socketConnected: boolean;
  initialize: () => Promise<void>;
  setView: (view: ViewMode) => void;
  setActiveAssignment: (assignmentId: string | null) => void;
  createAndGenerateAssignment: (values: AssignmentFormValues) => Promise<void>;
  triggerRegeneration: (assignmentId: string) => Promise<void>;
  hydrateAssignment: (assignment: Assignment) => void;
};

let initialized = false;

function sortAssignments(assignments: Assignment[]) {
  return [...assignments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  assignments: [],
  activeAssignmentId: null,
  view: "list",
  loading: true,
  submitting: false,
  error: null,
  socketConnected: false,
  async initialize() {
    if (!initialized) {
      initialized = true;
      socket.connect();
      socket.on("connect", () => set({ socketConnected: true }));
      socket.on("disconnect", () => set({ socketConnected: false }));
      socket.on("assignment:update", ({ assignment }: { assignment: Assignment }) => {
        get().hydrateAssignment(assignment);
      });
    }

    try {
      set({ loading: true, error: null });
      const { assignments } = await fetchAssignments();
      const sorted = sortAssignments(assignments);
      set({
        assignments: sorted,
        activeAssignmentId: sorted[0]?.id ?? null,
        view: sorted.length ? "list" : "list",
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load assignments.",
      });
    }
  },
  setView(view) {
    set({ view });
  },
  setActiveAssignment(activeAssignmentId) {
    set({ activeAssignmentId });
  },
  async createAndGenerateAssignment(values) {
    try {
      set({ submitting: true, error: null });
      const { assignment } = await createAssignment(values);
      get().hydrateAssignment(assignment);
      set({ activeAssignmentId: assignment.id, view: "output" });
      await generateAssignment(assignment.id);
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to create assignment.",
      });
    } finally {
      set({ submitting: false });
    }
  },
  async triggerRegeneration(assignmentId) {
    try {
      set({ submitting: true, error: null, activeAssignmentId: assignmentId, view: "output" });
      await regenerateAssignment(assignmentId);
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to regenerate assignment.",
      });
    } finally {
      set({ submitting: false });
    }
  },
  hydrateAssignment(assignment) {
    const existing = get().assignments.filter((item) => item.id !== assignment.id);
    const nextAssignments = sortAssignments([assignment, ...existing]);
    const currentView = get().view;

    set({
      assignments: nextAssignments,
      activeAssignmentId: assignment.id,
      view:
        assignment.generatedPaper || assignment.status === "generating" || assignment.status === "queued"
          ? "output"
          : currentView,
    });
  },
}));
