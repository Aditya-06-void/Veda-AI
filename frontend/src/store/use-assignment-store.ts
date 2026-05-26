"use client";

import { create } from "zustand";

import {
  createAssignment,
  deleteAssignment,
  fetchAssignments,
  generateAssignment,
  regenerateAssignment,
  uploadAssignmentFile,
} from "@/lib/api";
import { socket } from "@/lib/socket";
import { Assignment, AssignmentFormValues } from "@/lib/types";

type ViewMode = "list" | "create" | "output";
type NavMode = "assignments" | "toolkit";

type AssignmentStore = {
  assignments: Assignment[];
  activeAssignmentId: string | null;
  view: ViewMode;
  nav: NavMode;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  socketConnected: boolean;
  initialize: () => Promise<void>;
  setView: (view: ViewMode) => void;
  setNav: (nav: NavMode) => void;
  setActiveAssignment: (assignmentId: string | null) => void;
  createAndGenerateAssignment: (values: AssignmentFormValues) => Promise<void>;
  triggerRegeneration: (assignmentId: string) => Promise<void>;
  removeAssignment: (assignmentId: string) => Promise<void>;
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
  nav: "assignments",
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
      socket.on("assignment:deleted", ({ assignmentId }: { assignmentId: string }) => {
        const nextAssignments = get().assignments.filter((item) => item.id !== assignmentId);
        set({
          assignments: nextAssignments,
          activeAssignmentId: nextAssignments[0]?.id ?? null,
          view: "list",
          nav: "assignments",
        });
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
  setNav(nav) {
    set({ nav });
  },
  setActiveAssignment(activeAssignmentId) {
    set({ activeAssignmentId });
  },
  async createAndGenerateAssignment(values) {
    try {
      set({ submitting: true, error: null });
      const { assignment } = await createAssignment(values);
      get().hydrateAssignment(assignment);
      set({ activeAssignmentId: assignment.id, view: "output", nav: "toolkit" });

      // Source upload is mandatory — the generator binds questions to this text.
      // If it fails we must NOT silently fall through to a generic paper.
      if (!values.file) {
        throw new Error("A source file is required to generate a question paper.");
      }

      const uploadResult = await uploadAssignmentFile(assignment.id, values.file);
      get().hydrateAssignment(uploadResult.assignment);

      if (!uploadResult.assignment.extractedText || uploadResult.extractedChars < 50) {
        throw new Error(
          `Source file uploaded but no readable text was extracted (${uploadResult.extractedChars} chars). ` +
            "Please upload a valid PDF, HTML, or TXT file with actual content.",
        );
      }

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
  async removeAssignment(assignmentId) {
    try {
      set({ submitting: true, error: null });
      await deleteAssignment(assignmentId);
      const nextAssignments = get().assignments.filter((item) => item.id !== assignmentId);
      set({
        assignments: nextAssignments,
        activeAssignmentId: nextAssignments[0]?.id ?? null,
        view: "list",
        nav: "assignments",
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete assignment.",
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
      nav:
        assignment.generatedPaper || assignment.status === "generating" || assignment.status === "queued"
          ? "toolkit"
          : "assignments",
      view:
        assignment.generatedPaper || assignment.status === "generating" || assignment.status === "queued"
          ? "output"
          : currentView,
    });
  },
}));
