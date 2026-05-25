"use client";

import {
  ArrowRight,
  BookOpen,
  Bot,
  ClipboardList,
  Flame,
  Library,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { MobileHeader } from "@/components/layout/mobile-header";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { demoAssignments, schoolProfile } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { useAssignmentStore } from "@/store/use-assignment-store";

const stats = [
  { label: "Assignments", value: "24", icon: ClipboardList, color: "#ff6f2c", bg: "#fff3ee" },
  { label: "Active Groups", value: "6", icon: Users, color: "#6366f1", bg: "#eef2ff" },
  { label: "Students", value: "188", icon: BookOpen, color: "#0ea5e9", bg: "#f0f9ff" },
  { label: "AI Generated", value: "18", icon: Sparkles, color: "#10b981", bg: "#ecfdf5" },
];

const quickActions = [
  {
    label: "Create Assignment",
    description: "Generate AI-powered question papers",
    icon: Plus,
    href: "/assignments",
    accent: "#ff6f2c",
    bg: "#fff3ee",
    create: true,
  },
  {
    label: "My Groups",
    description: "Manage your class groups",
    icon: Users,
    href: "/groups",
    accent: "#6366f1",
    bg: "#eef2ff",
  },
  {
    label: "AI Toolkit",
    description: "Lesson plans, quizzes & more",
    icon: Bot,
    href: "/toolkit",
    accent: "#0ea5e9",
    bg: "#f0f9ff",
  },
  {
    label: "My Library",
    description: "Browse saved resources",
    icon: Library,
    href: "/library",
    accent: "#10b981",
    bg: "#ecfdf5",
  },
];

const recentActivity = [
  { text: "Science Q.Paper Grade 8 generated", time: "2 hours ago", icon: Sparkles, color: "#ff6f2c" },
  { text: "Math Quiz Grade 10 created", time: "Yesterday", icon: ClipboardList, color: "#6366f1" },
  { text: "New group Physics Grade 11 added", time: "2 days ago", icon: Users, color: "#0ea5e9" },
  { text: "English Worksheet Grade 7 saved", time: "3 days ago", icon: BookOpen, color: "#10b981" },
];

export default function HomePage() {
  const router = useRouter();
  const { setView, setNav } = useAssignmentStore();

  function handleCreate() {
    setView("create");
    setNav("assignments");
    router.push("/assignments");
  }

  return (
    <>
      <Topbar title="Home" mode="assignments" />
      <MobileHeader title="Home" />

      {/* Welcome banner */}
      <Card className="rounded-[28px] bg-[#2a2a2a] px-6 py-5 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/60">Good morning 👋</p>
            <h1 className="mt-1 text-[22px] font-extrabold leading-tight md:text-[26px]">
              Welcome back, {schoolProfile.teacher}!
            </h1>
            <p className="mt-1 text-sm text-white/70">
              {schoolProfile.schoolName} · {schoolProfile.campus}
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="w-fit rounded-full bg-[#ff6f2c] px-6 text-white hover:bg-[#e85f1e]"
          >
            <Sparkles className="size-4" />
            New Assignment
          </Button>
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="rounded-[24px] p-4">
            <div
              className="flex size-10 items-center justify-center rounded-2xl"
              style={{ background: s.bg }}
            >
              <s.icon className="size-5" style={{ color: s.color }} />
            </div>
            <div className="mt-3 text-[26px] font-extrabold text-[#2d2d2d]">{s.value}</div>
            <div className="text-sm text-[#888]">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 px-1 text-[15px] font-bold text-[#2d2d2d]">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {quickActions.map((action) =>
            action.create ? (
              <button
                key={action.label}
                onClick={handleCreate}
                className="group rounded-[24px] bg-white/80 p-4 text-left backdrop-blur-sm transition-all hover:shadow-md active:scale-[0.98]"
              >
                <div
                  className="flex size-10 items-center justify-center rounded-2xl"
                  style={{ background: action.bg }}
                >
                  <action.icon className="size-5" style={{ color: action.accent }} />
                </div>
                <div className="mt-3 font-bold text-[#2d2d2d]">{action.label}</div>
                <div className="mt-0.5 text-xs text-[#888]">{action.description}</div>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold" style={{ color: action.accent }}>
                  Get started <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            ) : (
              <Link
                key={action.label}
                href={action.href}
                className="group rounded-[24px] bg-white/80 p-4 backdrop-blur-sm transition-all hover:shadow-md active:scale-[0.98]"
              >
                <div
                  className="flex size-10 items-center justify-center rounded-2xl"
                  style={{ background: action.bg }}
                >
                  <action.icon className="size-5" style={{ color: action.accent }} />
                </div>
                <div className="mt-3 font-bold text-[#2d2d2d]">{action.label}</div>
                <div className="mt-0.5 text-xs text-[#888]">{action.description}</div>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold" style={{ color: action.accent }}>
                  Open <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ),
          )}
        </div>
      </div>

      {/* Bottom two-column row */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Recent assignments */}
        <Card className="rounded-[28px] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-[#2d2d2d]">Recent Assignments</h2>
            <Link href="/assignments" className="flex items-center gap-1 text-xs font-semibold text-[#ff6f2c] hover:underline">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {demoAssignments.slice(0, 3).map((a, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-[#f8f8f7] px-4 py-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#fff3ee]">
                  <ClipboardList className="size-4 text-[#ff6f2c]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-semibold text-[#2d2d2d]">{a.title}</div>
                  <div className="text-xs text-[#888]">Due {formatDate(a.dueDate)}</div>
                </div>
                <span className="rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[11px] font-semibold text-[#10b981]">
                  Done
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent activity */}
        <Card className="rounded-[28px] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-[#2d2d2d]">Recent Activity</h2>
            <TrendingUp className="size-4 text-[#888]" />
          </div>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="mt-0.5 flex size-8 flex-none items-center justify-center rounded-xl"
                  style={{ background: item.color + "18" }}
                >
                  <item.icon className="size-3.5" style={{ color: item.color }} />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#2d2d2d]">{item.text}</div>
                  <div className="text-xs text-[#aaa]">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI tip banner */}
      <Card className="rounded-[28px] border border-[#ff6f2c]/20 bg-[linear-gradient(135deg,#fff8f5,#fff3ee)] p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-10 flex-none items-center justify-center rounded-2xl bg-[#ff6f2c]/10">
            <Flame className="size-5 text-[#ff6f2c]" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-[#2d2d2d]">AI Tip of the Day</div>
            <p className="mt-1 text-sm text-[#666]">
              Try the <strong>AI Teacher's Toolkit</strong> to auto-generate lesson plans and personalised student
              feedback — save up to 3 hours of prep per week.
            </p>
          </div>
          <Link href="/toolkit">
            <Button variant="outline" className="hidden rounded-full sm:flex">
              Try it
            </Button>
          </Link>
        </div>
      </Card>
    </>
  );
}
