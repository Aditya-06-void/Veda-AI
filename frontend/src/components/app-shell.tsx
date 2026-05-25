"use client";

import { useEffect } from "react";

import { AssignmentEmptyState } from "@/components/assignment/assignment-empty-state";
import { AssignmentForm } from "@/components/assignment/assignment-form";
import { AssignmentList } from "@/components/assignment/assignment-list";
import { AssignmentOutput } from "@/components/assignment/assignment-output";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { useAssignmentStore } from "@/store/use-assignment-store";

export function AppShell() {
  const {
    assignments,
    activeAssignmentId,
    view,
    nav,
    loading,
    submitting,
    error,
    socketConnected,
    initialize,
    setView,
    setNav,
    setActiveAssignment,
    createAndGenerateAssignment,
    triggerRegeneration,
    removeAssignment,
  } = useAssignmentStore();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const activeAssignment = assignments.find((item) => item.id === activeAssignmentId) ?? null;

  return (
    <div className="h-screen overflow-hidden bg-[#f1f1ef] text-[#2d2d2d]">
      <div className="flex h-full gap-3 p-3">
        <Sidebar
          onCreate={() => {
            setView("create");
            setNav("assignments");
          }}
          active={nav}
          assignmentCount={Math.max(assignments.length, 10)}
        />

        <main className="flex flex-1 flex-col gap-3 overflow-y-auto pb-24 lg:pb-3">
          <div className="hidden md:block">
            <Topbar title={view === "create" ? "Assignment" : "Assignment"} mode={nav} />
          </div>
          <MobileHeader
            title={
              view === "create"
                ? "Create Assignment"
                : view === "output"
                  ? "Create New"
                  : "Assignments"
            }
          />

          <Card className="flex-1 rounded-[30px] p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between px-1">
              <div className="text-sm text-[#888]">
                {socketConnected ? "Realtime connected" : "Connecting to realtime updates..."}
              </div>
              {error ? (
                <div className="rounded-full bg-rose-100 px-4 py-1.5 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}
            </div>

            {loading ? (
              <div className="flex min-h-[60vh] items-center justify-center">
                <div className="size-12 animate-spin rounded-full border-4 border-black/10 border-t-black" />
              </div>
            ) : null}

            {!loading && view === "list" && assignments.length === 0 ? (
              <AssignmentEmptyState
                onCreate={() => {
                  setView("create");
                  setNav("assignments");
                }}
              />
            ) : null}

            {!loading && view === "list" && assignments.length > 0 ? (
              <AssignmentList
                assignments={assignments}
                onCreate={() => {
                  setView("create");
                  setNav("assignments");
                }}
                onDelete={removeAssignment}
                onOpen={(assignmentId) => {
                  setActiveAssignment(assignmentId);
                  setView("output");
                  setNav("toolkit");
                }}
              />
            ) : null}

            {!loading && view === "create" ? (
              <AssignmentForm
                submitting={submitting}
                onCancel={() => {
                  setView("list");
                  setNav("assignments");
                }}
                onSubmit={createAndGenerateAssignment}
              />
            ) : null}

            {!loading && view === "output" && activeAssignment ? (
              <AssignmentOutput
                assignment={activeAssignment}
                busy={submitting}
                onRegenerate={triggerRegeneration}
              />
            ) : null}
          </Card>
        </main>
      </div>

      <MobileNav
        active={nav}
        onCreate={() => {
          setView("create");
          setNav("assignments");
        }}
      />
    </div>
  );
}
