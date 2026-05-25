"use client";

import { useMemo, useState } from "react";
import {
  Filter,
  MoreVertical,
  Plus,
  Search,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Assignment } from "@/lib/types";
import { demoAssignments } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";

type Props = {
  assignments: Assignment[];
  onOpen: (assignmentId: string) => void;
  onDelete: (assignmentId: string) => Promise<void>;
  onCreate: () => void;
};

export function AssignmentList({
  assignments,
  onOpen,
  onDelete,
  onCreate,
}: Props) {
  const [search, setSearch] = useState("");

  const items = useMemo(() => {
    const merged = assignments.length
      ? assignments
      : demoAssignments.map((item, index) => ({
          id: `demo-${index}`,
          title: item.title,
          schoolName: "Delhi Public School",
          board: "CBSE",
          className: "Grade 8",
          subject: "Science",
          dueDate: item.dueDate,
          instructions: "",
          questionTypes: [],
          totalQuestions: 25,
          totalMarks: 60,
          createdAt: item.createdAt,
          status: "draft" as const,
        }));

    return merged.filter((assignment) =>
      assignment.title.toLowerCase().includes(search.toLowerCase()),
    );
  }, [assignments, search]);

  return (
    <div className="space-y-5">
      <div className="px-1">
        <div className="flex items-center gap-3">
          <span className="size-4 rounded-full bg-emerald-400 ring-4 ring-emerald-100" />
          <div>
            <h1 className="text-[20px] font-extrabold tracking-[-0.04em] text-[#2d2d2d] md:text-[40px]">
              Assignments
            </h1>
            <p className="hidden text-[#8a8a8a] md:block">
              Manage and create assignments for your classes.
            </p>
          </div>
        </div>
      </div>

      <div className="hidden gap-4 md:grid md:grid-cols-[1fr_420px]">
        <Card className="flex h-16 items-center gap-3 px-6 text-sm font-semibold text-[#b4b4b4]">
          <Filter className="size-4" />
          Filter By
        </Card>
        <Card className="flex h-16 items-center gap-3 px-5">
          <Search className="size-4 text-[#a7a7a7]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-auto w-full bg-transparent text-sm outline-none placeholder:text-[#a7a7a7]"
            placeholder="Search Assignment"
          />
        </Card>
      </div>

      <div className="space-y-5 md:hidden">
        <div className="flex items-center justify-between">
          <button className="flex size-12 items-center justify-center rounded-full bg-white/70 text-[#444]">
            <Filter className="size-5" />
          </button>
          <h2 className="text-[18px] font-bold">Assignments</h2>
          <div className="w-12" />
        </div>
        <div className="grid grid-cols-[84px_1fr] gap-3">
          <Card className="flex h-14 items-center justify-center rounded-[20px] text-[#b0b0b0]">
            <Filter className="size-4" />
          </Card>
          <Card className="flex h-14 items-center gap-3 rounded-[20px] px-4">
            <Search className="size-4 text-[#a7a7a7]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#a7a7a7]"
              placeholder="Search Name"
            />
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((assignment) => (
          <Card
            key={assignment.id}
            className={cn(
              "min-h-[121px] rounded-[28px] px-6 py-6 transition-transform duration-200 hover:-translate-y-0.5",
              "md:min-h-[158px]",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <button
                type="button"
                onClick={() => onOpen(assignment.id)}
                className="text-left"
              >
                <h3 className="text-[21px] font-extrabold tracking-[-0.04em] text-[#2d2d2d] md:text-[22px]">
                  {assignment.title}
                </h3>
              </button>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="rounded-full p-1 text-[#9f9f9f]">
                    <MoreVertical className="size-5" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="z-50 min-w-40 rounded-[18px] border border-black/5 bg-white p-2 shadow-2xl"
                  >
                    <DropdownMenu.Item
                      onSelect={() => onOpen(assignment.id)}
                      className="cursor-pointer rounded-xl px-3 py-2 text-sm outline-none hover:bg-black/5"
                    >
                      View Assignment
                    </DropdownMenu.Item>
                    {!assignment.id.startsWith("demo-") ? (
                      <DropdownMenu.Item
                        onSelect={() => void onDelete(assignment.id)}
                        className="cursor-pointer rounded-xl px-3 py-2 text-sm text-[#e64d3d] outline-none hover:bg-[#fff5f3]"
                      >
                        Delete
                      </DropdownMenu.Item>
                    ) : null}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
            <div className="mt-10 flex items-center justify-between text-[14px] text-[#616161] md:mt-16 md:text-[15px]">
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
        ))}
      </div>

      <div className="hidden justify-center pt-2 md:flex">
        <Button className="h-14 px-10" onClick={onCreate}>
          <Plus className="size-5" />
          Create Assignment
        </Button>
      </div>
    </div>
  );
}
