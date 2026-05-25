"use client";

import {
  BookOpen,
  ClipboardList,
  FlaskConical,
  GraduationCap,
  Landmark,
  MoreHorizontal,
  Plus,
  Search,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { MobileHeader } from "@/components/layout/mobile-header";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Group = {
  id: string;
  subject: string;
  className: string;
  students: number;
  assignments: number;
  color: string;
  bg: string;
  icon: React.ElementType;
  board: string;
};

const demoGroups: Group[] = [
  { id: "g1", subject: "Science", className: "Grade 8", students: 32, assignments: 4, color: "#10b981", bg: "#ecfdf5", icon: FlaskConical, board: "CBSE" },
  { id: "g2", subject: "Mathematics", className: "Grade 10", students: 28, assignments: 6, color: "#6366f1", bg: "#eef2ff", icon: Zap, board: "CBSE" },
  { id: "g3", subject: "English", className: "Grade 7", students: 35, assignments: 3, color: "#8b5cf6", bg: "#f5f3ff", icon: BookOpen, board: "ICSE" },
  { id: "g4", subject: "Physics", className: "Grade 11", students: 25, assignments: 5, color: "#0ea5e9", bg: "#f0f9ff", icon: Zap, board: "CBSE" },
  { id: "g5", subject: "Chemistry", className: "Grade 9", students: 30, assignments: 4, color: "#f59e0b", bg: "#fffbeb", icon: FlaskConical, board: "CBSE" },
  { id: "g6", subject: "History", className: "Grade 8", students: 38, assignments: 2, color: "#ec4899", bg: "#fdf2f8", icon: Landmark, board: "ICSE" },
];

const boardColors: Record<string, string> = {
  CBSE: "#0ea5e9",
  ICSE: "#8b5cf6",
};

function GroupCard({ group }: { group: Group }) {
  return (
    <Card className="group rounded-[28px] p-5 transition-all hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div
          className="flex size-12 items-center justify-center rounded-2xl"
          style={{ background: group.bg }}
        >
          <group.icon className="size-6" style={{ color: group.color }} />
        </div>
        <button className="flex size-8 items-center justify-center rounded-full text-[#aaa] opacity-0 transition-opacity hover:bg-[#f3f3f3] hover:text-[#2d2d2d] group-hover:opacity-100">
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      <div className="mt-4">
        <h3 className="text-[17px] font-extrabold text-[#2d2d2d]">{group.subject}</h3>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-sm text-[#888]">{group.className}</span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ background: boardColors[group.board] + "18", color: boardColors[group.board] }}
          >
            {group.board}
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-4 border-t border-[#f0f0f0] pt-4">
        <div className="flex items-center gap-1.5">
          <Users className="size-3.5 text-[#aaa]" />
          <span className="text-sm font-semibold text-[#2d2d2d]">{group.students}</span>
          <span className="text-xs text-[#aaa]">students</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ClipboardList className="size-3.5 text-[#aaa]" />
          <span className="text-sm font-semibold text-[#2d2d2d]">{group.assignments}</span>
          <span className="text-xs text-[#aaa]">papers</span>
        </div>
      </div>

      <Button
        variant="secondary"
        className="mt-4 w-full rounded-full text-sm shadow-none"
        style={{ background: group.bg, color: group.color }}
      >
        Open Group
      </Button>
    </Card>
  );
}

export default function GroupsPage() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newGroup, setNewGroup] = useState({ subject: "", className: "", board: "CBSE" });

  const filtered = demoGroups.filter(
    (g) =>
      g.subject.toLowerCase().includes(search.toLowerCase()) ||
      g.className.toLowerCase().includes(search.toLowerCase()),
  );

  const totalStudents = demoGroups.reduce((s, g) => s + g.students, 0);

  return (
    <>
      <Topbar title="My Groups" mode="assignments" />
      <MobileHeader title="My Groups" />

      {/* Header card */}
      <Card className="rounded-[28px] bg-[#2a2a2a] px-6 py-5 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[22px] font-extrabold">My Groups</h1>
            <p className="mt-1 text-sm text-white/60">
              {demoGroups.length} groups · {totalStudents} students total
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="w-fit rounded-full bg-white px-5 text-[#2a2a2a] hover:bg-white/90"
          >
            <Plus className="size-4" />
            New Group
          </Button>
        </div>
      </Card>

      {/* Create group inline form */}
      {showForm && (
        <Card className="rounded-[28px] p-5">
          <h2 className="mb-4 font-bold text-[#2d2d2d]">Create New Group</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#888]">Subject</label>
              <input
                type="text"
                placeholder="e.g. Physics"
                value={newGroup.subject}
                onChange={(e) => setNewGroup({ ...newGroup, subject: e.target.value })}
                className="w-full rounded-2xl border border-[#e8e8e8] bg-[#f8f8f7] px-4 py-2.5 text-sm outline-none focus:border-[#ff6f2c]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#888]">Class</label>
              <input
                type="text"
                placeholder="e.g. Grade 10"
                value={newGroup.className}
                onChange={(e) => setNewGroup({ ...newGroup, className: e.target.value })}
                className="w-full rounded-2xl border border-[#e8e8e8] bg-[#f8f8f7] px-4 py-2.5 text-sm outline-none focus:border-[#ff6f2c]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#888]">Board</label>
              <select
                value={newGroup.board}
                onChange={(e) => setNewGroup({ ...newGroup, board: e.target.value })}
                className="w-full rounded-2xl border border-[#e8e8e8] bg-[#f8f8f7] px-4 py-2.5 text-sm outline-none focus:border-[#ff6f2c]"
              >
                <option>CBSE</option>
                <option>ICSE</option>
                <option>State Board</option>
                <option>IB</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button className="rounded-full bg-[#2a2a2a] px-6">Create Group</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} className="rounded-full">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Search + filter row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#aaa]" />
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-[#e8e8e8] bg-white py-2.5 pr-4 pl-10 text-sm outline-none focus:border-[#ff6f2c]"
          />
        </div>
        <div className="flex gap-2">
          {["All", "CBSE", "ICSE"].map((b) => (
            <button
              key={b}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                b === "All"
                  ? "bg-[#2a2a2a] text-white"
                  : "bg-white text-[#888] hover:bg-[#f3f3f3]",
              )}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Groups", value: demoGroups.length, icon: GraduationCap, color: "#ff6f2c" },
          { label: "Total Students", value: totalStudents, icon: Users, color: "#6366f1" },
          { label: "Total Papers", value: demoGroups.reduce((s, g) => s + g.assignments, 0), icon: ClipboardList, color: "#10b981" },
        ].map((s) => (
          <Card key={s.label} className="rounded-[24px] px-4 py-3">
            <div className="flex items-center gap-2">
              <s.icon className="size-4" style={{ color: s.color }} />
              <span className="text-[22px] font-extrabold text-[#2d2d2d]">{s.value}</span>
            </div>
            <div className="mt-0.5 text-xs text-[#888]">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Groups grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      ) : (
        <Card className="flex min-h-48 flex-col items-center justify-center rounded-[28px] text-center">
          <Users className="size-10 text-[#ddd]" />
          <p className="mt-3 font-semibold text-[#888]">No groups found</p>
          <p className="mt-1 text-sm text-[#bbb]">Try a different search term</p>
        </Card>
      )}
    </>
  );
}
