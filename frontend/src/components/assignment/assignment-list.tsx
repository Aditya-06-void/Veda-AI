"use client";

import { MoreVertical, Search } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Assignment } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function AssignmentList({
  assignments,
  onOpen,
}: {
  assignments: Assignment[];
  onOpen: (assignmentId: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="px-2">
        <div className="flex items-center gap-3">
          <span className="size-4 rounded-full bg-emerald-400 ring-4 ring-emerald-100" />
          <div>
            <h1 className="text-[40px] font-extrabold tracking-[-0.04em] text-[#2d2d2d] max-md:text-3xl">
              Assignments
            </h1>
            <p className="text-[#8a8a8a]">
              Manage and create assignments for your classes.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_390px]">
        <Card className="flex h-16 items-center px-6 text-sm font-semibold text-[#b4b4b4]">
          Filter By
        </Card>
        <Card className="flex h-16 items-center px-5">
          <Search className="mr-3 size-4 text-[#a7a7a7]" />
          <Input
            className="h-auto border-none bg-transparent p-0 shadow-none"
            placeholder="Search Assignment"
          />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {assignments.map((assignment) => (
          <button
            key={assignment.id}
            type="button"
            onClick={() => onOpen(assignment.id)}
            className="text-left"
          >
            <Card className="min-h-[158px] rounded-[28px] px-6 py-6 transition-transform duration-200 hover:-translate-y-1">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-[22px] font-extrabold tracking-[-0.04em] text-[#2d2d2d]">
                  {assignment.title}
                </h3>
                <MoreVertical className="size-5 text-[#9f9f9f]" />
              </div>
              <div className="mt-16 flex items-center justify-between text-[15px] text-[#616161]">
                <p>
                  <span className="font-extrabold text-[#2d2d2d]">Assigned on :</span>{" "}
                  {formatDate(assignment.createdAt)}
                </p>
                <p>
                  <span className="font-extrabold text-[#2d2d2d]">Due :</span>{" "}
                  {formatDate(assignment.dueDate)}
                </p>
              </div>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
