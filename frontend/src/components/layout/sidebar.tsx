"use client";

import {
  BookOpen,
  Bot,
  ClipboardList,
  Grid2X2,
  Library,
  Sparkles,
  Settings,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { schoolProfile } from "@/lib/constants";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", icon: Grid2X2 },
  { label: "My Groups", icon: Users },
  { label: "Assignments", icon: ClipboardList, key: "assignments" as const },
  { label: "AI Teacher’s Toolkit", icon: Bot, key: "toolkit" as const },
  { label: "My Library", icon: Library },
];

export function Sidebar({
  onCreate,
  active,
  assignmentCount,
}: {
  onCreate: () => void;
  active: "assignments" | "toolkit";
  assignmentCount: number;
}) {
  return (
    <Card className="hidden h-full w-[260px] flex-none flex-col justify-between overflow-y-auto rounded-[26px] px-4 py-5 lg:flex">
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#F8B661_0%,#A3402D_100%)] shadow-lg">
            <BookOpen className="size-5 text-white" />
          </div>
          <div className="text-[19px] font-extrabold text-[#292929]">VedaAI</div>
        </div>

        <Button
          onClick={onCreate}
          className="h-13 w-full justify-start rounded-full border-[4px] border-[#f57f57] bg-[#2a2a2a] px-6 text-[15px]"
        >
          <Sparkles className="size-4" />
          Create Assignment
        </Button>

        <nav className="space-y-2 px-2">
          {navItems.map((item) => (
            <div
              key={item.label}
              className={cn(
                "flex items-center justify-between rounded-2xl px-4 py-3 text-[15px] text-[#7b7b7b]",
                item.key === active && "bg-[#f3f3f3] font-semibold text-[#2d2d2d]",
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="size-4.5" />
                <span>{item.label}</span>
              </div>
              {item.key === "assignments" && assignmentCount > 0 ? (
                <span className="rounded-full bg-[#ff6f2c] px-2 py-0.5 text-[11px] font-bold text-white">
                  {assignmentCount}
                </span>
              ) : null}
            </div>
          ))}
        </nav>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 px-4 text-[#7b7b7b]">
          <Settings className="size-4.5" />
          <span>Settings</span>
        </div>
        <div className="rounded-[20px] bg-[#f5f5f5] p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#ffd8c4] text-sm font-black text-[#2d2d2d]">
              DPS
            </div>
            <div>
              <div className="font-bold text-[#2d2d2d]">{schoolProfile.schoolName}</div>
              <div className="text-sm text-[#7b7b7b]">{schoolProfile.campus}</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
