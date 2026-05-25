"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { AssignmentEmptyState } from "@/components/assignment/assignment-empty-state";
import { AssignmentForm } from "@/components/assignment/assignment-form";
import { AssignmentList } from "@/components/assignment/assignment-list";
import { AssignmentOutput } from "@/components/assignment/assignment-output";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { useAssignmentStore } from "@/store/use-assignment-store";

export default function AssignmentsPage() {
  const searchParams = useSearchParams();
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

  // Honour ?view=create coming from sidebar "Create Assignment"
  useEffect(() => {
    if (searchParams.get("view") === "create") {
      setView("create");
      setNav("assignments");
    }
  }, [searchParams, setView, setNav]);

  const activeAssignment = assignments.find((item) => item.id === activeAssignmentId) ?? null;

  const topbarMode = nav === "toolkit" ? "toolkit" : "assignments";
  const mobileTitle =
    view === "create" ? "Create Assignment" : view === "output" ? "Create New" : "Assignments";

  return (
    <>
      <Topbar
        title={view === "create" ? "Create Assignment" : "Assignments"}
        mode={topbarMode}
      />
      <MobileHeader title={mobileTitle} />

      <Card className="flex-1 rounded-[30px] p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between px-1">
          <div className="text-sm text-[#888]">
            {socketConnected ? "Realtime connected" : "Connecting to realtime updates..."}
          </div>
          {error ? (
            <div className="rounded-full bg-rose-100 px-4 py-1.5 text-sm text-rose-700">{error}</div>
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
    </>
  );
}
