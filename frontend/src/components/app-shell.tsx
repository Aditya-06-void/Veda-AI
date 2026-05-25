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
    <div className="min-h-screen bg-[#f1f1ef] p-3 text-[#2d2d2d]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_transparent_40%),radial-gradient(circle_at_65%_40%,_rgba(255,255,255,0.85),_transparent_30%),linear-gradient(180deg,#f6f5f2_0%,#eceae5_100%)]" />
      <div className="relative mx-auto flex max-w-[1440px] gap-3">
        <Sidebar
          onCreate={() => {
            setView("create");
            setNav("assignments");
          }}
          active={nav}
          assignmentCount={Math.max(assignments.length, 10)}
        />

        <main className="flex-1 space-y-3 pb-28 lg:pb-6">
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

          <Card className="min-h-[calc(100vh-92px)] rounded-[30px] p-4 md:p-6">
            <div className="mb-5 flex items-center justify-between px-2">
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
              <div className="flex min-h-[70vh] items-center justify-center">
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
