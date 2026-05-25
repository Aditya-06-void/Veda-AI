"use client";

import {
  BookOpen,
  ClipboardList,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  MoreHorizontal,
  Search,
  Star,
  Upload,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

import { MobileHeader } from "@/components/layout/mobile-header";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteLibraryDoc, fetchLibraryDocs } from "@/lib/api";
import { LibraryDoc } from "@/lib/types";
import { cn } from "@/lib/utils";

const typeConfig: Record<LibraryDoc["type"], { label: string; color: string; bg: string; icon: React.ElementType }> = {
  paper: { label: "Q. Paper", color: "#ff6f2c", bg: "#fff3ee", icon: ClipboardList },
  quiz: { label: "Quiz", color: "#6366f1", bg: "#eef2ff", icon: Zap },
  lesson: { label: "Lesson Plan", color: "#0ea5e9", bg: "#f0f9ff", icon: BookOpen },
  guide: { label: "Study Guide", color: "#10b981", bg: "#ecfdf5", icon: FileText },
  rubric: { label: "Rubric", color: "#f59e0b", bg: "#fffbeb", icon: GraduationCap },
};

const tabs = [
  { key: "all", label: "All" },
  { key: "paper", label: "Q. Papers" },
  { key: "quiz", label: "Quizzes" },
  { key: "lesson", label: "Lesson Plans" },
  { key: "guide", label: "Study Guides" },
];

function DocCard({ doc, onDelete }: { doc: LibraryDoc; onDelete: (id: string) => void }) {
  const cfg = typeConfig[doc.type];
  return (
    <Card className="group rounded-3xl p-3 transition-all hover:shadow-md sm:p-4">
      <div className="flex items-start justify-between">
        <div className="flex size-9 items-center justify-center rounded-2xl sm:size-11" style={{ background: cfg.bg }}>
          <cfg.icon className="size-4 sm:size-5" style={{ color: cfg.color }} />
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button className="flex size-7 items-center justify-center rounded-full hover:bg-[#f3f3f3]">
            <Download className="size-3.5 text-[#888]" />
          </button>
          <button
            onClick={() => onDelete(doc.id)}
            className="flex size-7 items-center justify-center rounded-full hover:bg-[#f3f3f3]"
          >
            <MoreHorizontal className="size-3.5 text-[#888]" />
          </button>
        </div>
      </div>

      <div className="mt-2 sm:mt-3">
        <div className="flex items-start gap-2">
          <h3 className="flex-1 text-xs font-bold leading-snug text-[#2d2d2d] sm:text-sm">{doc.title}</h3>
          {doc.starred && <Star className="mt-0.5 size-3 flex-none fill-[#f59e0b] text-[#f59e0b] sm:size-3.5" />}
        </div>
        <p className="mt-0.5 text-[10px] text-[#888] sm:text-xs">{doc.subject} · {doc.className}</p>
      </div>

      <div className="mt-2 flex items-center justify-between sm:mt-3">
        <span className="rounded-full px-2 py-0.5 text-[9px] font-bold sm:text-[10px]" style={{ background: cfg.bg, color: cfg.color }}>
          {cfg.label}
        </span>
        <div className="flex items-center gap-1.5 text-[10px] text-[#aaa] sm:text-xs">
          <span>{doc.pages}p</span>
          <span>·</span>
          <span>{new Date(doc.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
        </div>
      </div>
    </Card>
  );
}

export default function LibraryPage() {
  const [docs, setDocs] = useState<LibraryDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLibraryDocs()
      .then(({ docs }) => setDocs(docs))
      .catch(() => {/* show empty state */})
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    await deleteLibraryDoc(id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  const filtered = docs.filter((d) => {
    const matchTab = tab === "all" || d.type === tab;
    const matchSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.subject.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const starred = docs.filter((d) => d.starred);

  return (
    <>
      <Topbar title="My Library" mode="assignments" />
      <MobileHeader title="My Library" />

      {/* Hero */}
      <Card className="rounded-[28px] bg-[#2a2a2a] px-4 py-5 text-white sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[20px] font-extrabold sm:text-[22px]">My Library</h1>
            <p className="mt-0.5 text-xs text-white/60 sm:text-sm">
              {docs.length} resources · {starred.length} starred
            </p>
          </div>
          <Button className="w-fit rounded-full bg-white px-4 text-sm text-[#2a2a2a] hover:bg-white/90 sm:px-5">
            <Upload className="size-4" />
            Upload
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
        {(Object.entries(typeConfig) as [LibraryDoc["type"], typeof typeConfig[LibraryDoc["type"]]][]).map(([key, cfg]) => {
          const count = docs.filter((d) => d.type === key).length;
          return (
            <Card
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "cursor-pointer rounded-[20px] p-3 transition-all hover:shadow-md sm:p-4",
                tab === key && "ring-2",
              )}
              style={tab === key ? { background: cfg.bg, outline: `2px solid ${cfg.color}`, outlineOffset: "0px" } : {}}
            >
              <div className="flex size-8 items-center justify-center rounded-xl sm:size-9" style={{ background: tab === key ? "white" : cfg.bg }}>
                <cfg.icon className="size-3.5 sm:size-4" style={{ color: cfg.color }} />
              </div>
              <div className="mt-2 text-xl font-extrabold text-[#2d2d2d] sm:text-[22px]">{count}</div>
              <div className="text-[10px] text-[#888] sm:text-xs">{cfg.label}s</div>
            </Card>
          );
        })}
      </div>

      {/* Starred row */}
      {!loading && starred.length > 0 && tab === "all" && !search && (
        <div>
          <div className="mb-2 flex items-center gap-2 px-1 sm:mb-3">
            <Star className="size-3.5 fill-[#f59e0b] text-[#f59e0b] sm:size-4" />
            <h2 className="text-sm font-bold text-[#2d2d2d] sm:text-[15px]">Starred</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
            {starred.map((d) => <DocCard key={d.id} doc={d} onDelete={handleDelete} />)}
          </div>
        </div>
      )}

      {/* Tab bar + search */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-none rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm",
                tab === t.key ? "bg-[#2a2a2a] text-white" : "bg-white text-[#888] hover:bg-[#f3f3f3]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#aaa]" />
          <input
            type="text"
            placeholder="Search library..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-[#e8e8e8] bg-white py-2.5 pr-4 pl-10 text-sm outline-none focus:border-[#ff6f2c]"
          />
        </div>
      </div>

      {/* Document grid */}
      {loading ? (
        <div className="flex min-h-48 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-[#ddd]" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((d) => <DocCard key={d.id} doc={d} onDelete={handleDelete} />)}
        </div>
      ) : (
        <Card className="flex min-h-48 flex-col items-center justify-center rounded-[28px] text-center">
          <FileText className="size-10 text-[#ddd]" />
          <p className="mt-3 font-semibold text-[#888]">No documents found</p>
          <p className="mt-1 text-sm text-[#bbb]">Try a different filter or search term</p>
        </Card>
      )}
    </>
  );
}
