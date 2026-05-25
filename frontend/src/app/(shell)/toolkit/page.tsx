"use client";

import {
  Bot,
  ChevronRight,
  ClipboardList,
  FileText,
  Lightbulb,
  MessageSquare,
  Send,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useState } from "react";

import { MobileHeader } from "@/components/layout/mobile-header";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { API_BASE } from "@/lib/api";
import { cn } from "@/lib/utils";

type Tool = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  fields: Field[];
};

type Field = {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "select" | "textarea";
  options?: string[];
};

const tools: Tool[] = [
  {
    id: "lesson-plan",
    label: "Lesson Plan",
    description: "AI-crafted lesson plans aligned to your syllabus",
    icon: ClipboardList,
    color: "#ff6f2c",
    bg: "#fff3ee",
    fields: [
      { key: "subject", label: "Subject", placeholder: "e.g. Science" },
      { key: "className", label: "Class", placeholder: "e.g. Grade 8" },
      { key: "topic", label: "Topic", placeholder: "e.g. Photosynthesis" },
      { key: "duration", label: "Duration", placeholder: "e.g. 45 minutes" },
      { key: "board", label: "Board", placeholder: "CBSE", type: "select", options: ["CBSE", "ICSE", "State Board", "IB"] },
    ],
  },
  {
    id: "quiz",
    label: "Quiz Creator",
    description: "Instant quizzes with MCQs, short answers & answer keys",
    icon: Sparkles,
    color: "#6366f1",
    bg: "#eef2ff",
    fields: [
      { key: "subject", label: "Subject", placeholder: "e.g. Mathematics" },
      { key: "className", label: "Class", placeholder: "e.g. Grade 10" },
      { key: "topic", label: "Topic", placeholder: "e.g. Quadratic Equations" },
      { key: "count", label: "No. of Questions", placeholder: "10" },
      { key: "difficulty", label: "Difficulty", placeholder: "Mixed", type: "select", options: ["Easy", "Moderate", "Challenging", "Mixed"] },
    ],
  },
  {
    id: "feedback",
    label: "Student Feedback",
    description: "Personalised written feedback for individual students",
    icon: MessageSquare,
    color: "#10b981",
    bg: "#ecfdf5",
    fields: [
      { key: "studentName", label: "Student Name", placeholder: "e.g. Arjun Sharma" },
      { key: "subject", label: "Subject", placeholder: "e.g. English" },
      { key: "className", label: "Class", placeholder: "e.g. Grade 9" },
      { key: "performance", label: "Performance Notes", placeholder: "Describe strengths & weaknesses...", type: "textarea" },
    ],
  },
  {
    id: "study-guide",
    label: "Study Guide",
    description: "Comprehensive revision guides with key concepts & tips",
    icon: FileText,
    color: "#0ea5e9",
    bg: "#f0f9ff",
    fields: [
      { key: "subject", label: "Subject", placeholder: "e.g. Chemistry" },
      { key: "className", label: "Class", placeholder: "e.g. Grade 11" },
      { key: "chapter", label: "Chapter / Topic", placeholder: "e.g. Periodic Table" },
      { key: "board", label: "Board", placeholder: "CBSE", type: "select", options: ["CBSE", "ICSE", "State Board", "IB"] },
    ],
  },
  {
    id: "rubric",
    label: "Rubric Builder",
    description: "4-level assessment rubrics with clear descriptors",
    icon: Star,
    color: "#f59e0b",
    bg: "#fffbeb",
    fields: [
      { key: "subject", label: "Subject", placeholder: "e.g. English" },
      { key: "className", label: "Class", placeholder: "e.g. Grade 7" },
      { key: "topic", label: "Assignment Type", placeholder: "e.g. Essay Writing" },
      { key: "board", label: "Board", placeholder: "CBSE", type: "select", options: ["CBSE", "ICSE", "State Board", "IB"] },
    ],
  },
  {
    id: "explainer",
    label: "Concept Explainer",
    description: "Clear, grade-appropriate explanations with examples",
    icon: Lightbulb,
    color: "#8b5cf6",
    bg: "#f5f3ff",
    fields: [
      { key: "subject", label: "Subject", placeholder: "e.g. Physics" },
      { key: "className", label: "Class", placeholder: "e.g. Grade 10" },
      { key: "topic", label: "Concept", placeholder: "e.g. Newton's Laws of Motion" },
      { key: "board", label: "Board", placeholder: "CBSE", type: "select", options: ["CBSE", "ICSE", "State Board", "IB"] },
    ],
  },
];

function renderOutput(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) return <h2 key={i} className="mt-4 mb-1 text-sm font-extrabold text-[#2d2d2d] sm:text-base">{line.slice(3)}</h2>;
    if (line.startsWith("# ")) return <h1 key={i} className="mt-4 mb-2 text-base font-extrabold text-[#2d2d2d] sm:text-lg">{line.slice(2)}</h1>;
    if (line.startsWith("- ") || line.startsWith("• ")) return <li key={i} className="ml-4 list-disc text-xs text-[#444] sm:text-sm">{line.slice(2)}</li>;
    if (/^\d+\./.test(line)) return <li key={i} className="ml-4 list-decimal text-xs text-[#444] sm:text-sm">{line.replace(/^\d+\.\s*/, "")}</li>;
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return <p key={i} className="text-xs leading-relaxed text-[#444] sm:text-sm">{line}</p>;
  });
}

export default function ToolkitPage() {
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  function handleSelectTool(tool: Tool) {
    setActiveTool(tool);
    setInputs({});
    setOutput("");
    setError("");
  }

  function handleClose() {
    setActiveTool(null);
    setOutput("");
    setError("");
  }

  async function handleGenerate() {
    if (!activeTool) return;
    setGenerating(true);
    setOutput("");
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/toolkit/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: activeTool.id, ...inputs }),
      });

      if (!response.ok) {
        const err = await response.json() as { message?: string };
        throw new Error(err.message ?? "Generation failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response stream");

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data) as { token?: string; error?: string };
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.token) setOutput((prev) => prev + parsed.token);
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== "Unexpected token") throw parseErr;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <Topbar title="AI Teacher's Toolkit" mode="toolkit" />
      <MobileHeader title="AI Toolkit" />

      {/* Hero */}
      <Card className="rounded-[28px] bg-[#2a2a2a] px-4 py-5 text-white sm:px-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex size-10 flex-none items-center justify-center rounded-2xl bg-[#ff6f2c]/20 sm:size-12">
            <Bot className="size-5 text-[#ff6f2c] sm:size-6" />
          </div>
          <div>
            <h1 className="text-[18px] font-extrabold sm:text-[22px]">AI Teacher's Toolkit</h1>
            <p className="mt-0.5 text-xs text-white/60 sm:text-sm">
              6 AI-powered tools — powered by NVIDIA LLM
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Lesson Plans", "Quizzes", "Feedback", "Guides", "Rubrics", "Explainers"].map((tag) => (
                <span key={tag} className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] text-white/80 sm:px-3 sm:py-1 sm:text-xs">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Tool grid */}
      <div>
        <h2 className="mb-3 px-1 text-sm font-bold text-[#2d2d2d]">
          {activeTool ? `Selected: ${activeTool.label}` : "Choose a Tool"}
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
          {tools.map((tool) => {
            const selected = activeTool?.id === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => handleSelectTool(tool)}
                className={cn(
                  "group w-full rounded-[20px] p-3 text-left transition-all sm:rounded-[24px] sm:p-4",
                  selected ? "shadow-lg" : "bg-white/80 hover:shadow-md active:scale-[0.98]",
                )}
                style={selected ? { background: tool.bg, outline: `2px solid ${tool.color}`, outlineOffset: "0px" } : {}}
              >
                <div className="flex items-start justify-between">
                  <div className="flex size-9 items-center justify-center rounded-xl sm:size-11 sm:rounded-2xl" style={{ background: selected ? "white" : tool.bg }}>
                    <tool.icon className="size-4 sm:size-5" style={{ color: tool.color }} />
                  </div>
                  {selected && (
                    <span className="flex size-5 items-center justify-center rounded-full text-white sm:size-6" style={{ background: tool.color }}>
                      <Star className="size-2.5 fill-white sm:size-3" />
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs font-bold text-[#2d2d2d] sm:mt-3 sm:text-sm">{tool.label}</div>
                <div className="mt-0.5 hidden text-[10px] leading-relaxed text-[#888] sm:block sm:text-xs">{tool.description}</div>
                <div className="mt-2 flex items-center gap-0.5 text-[10px] font-semibold opacity-0 transition-opacity group-hover:opacity-100 sm:gap-1 sm:text-xs" style={{ color: tool.color }}>
                  Use <ChevronRight className="size-2.5 sm:size-3" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active tool panel */}
      {activeTool && (
        <Card className="rounded-[28px] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl sm:size-10 sm:rounded-2xl" style={{ background: activeTool.bg }}>
                <activeTool.icon className="size-4 sm:size-5" style={{ color: activeTool.color }} />
              </div>
              <div>
                <div className="text-sm font-bold text-[#2d2d2d] sm:text-base">{activeTool.label}</div>
                <div className="hidden text-xs text-[#888] sm:block">{activeTool.description}</div>
              </div>
            </div>
            <button onClick={handleClose} className="flex size-8 items-center justify-center rounded-full text-[#aaa] hover:bg-[#f3f3f3] hover:text-[#2d2d2d]">
              <X className="size-4" />
            </button>
          </div>

          {/* Input fields */}
          <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
            {activeTool.fields.map((field) => (
              <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                <label className="mb-1 block text-[10px] font-semibold text-[#888] sm:text-xs">{field.label}</label>
                {field.type === "select" ? (
                  <select
                    value={inputs[field.key] ?? ""}
                    onChange={(e) => setInputs({ ...inputs, [field.key]: e.target.value })}
                    className="w-full rounded-xl border border-[#e8e8e8] bg-[#f8f8f7] px-3 py-2 text-xs outline-none focus:border-[#ff6f2c] sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm"
                  >
                    <option value="">{field.placeholder}</option>
                    {field.options?.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    placeholder={field.placeholder}
                    value={inputs[field.key] ?? ""}
                    onChange={(e) => setInputs({ ...inputs, [field.key]: e.target.value })}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-[#e8e8e8] bg-[#f8f8f7] px-3 py-2 text-xs outline-none focus:border-[#ff6f2c] sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={inputs[field.key] ?? ""}
                    onChange={(e) => setInputs({ ...inputs, [field.key]: e.target.value })}
                    className="w-full rounded-xl border border-[#e8e8e8] bg-[#f8f8f7] px-3 py-2 text-xs outline-none focus:border-[#ff6f2c] sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm"
                  />
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="mt-4 rounded-full px-6 text-sm"
            style={generating ? {} : { background: activeTool.color }}
          >
            {generating ? (
              <><div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Generating...</>
            ) : (
              <><Sparkles className="size-4" />Generate with AI</>
            )}
          </Button>

          {error && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-xs text-rose-700 sm:text-sm">{error}</div>}

          {/* Streaming output */}
          {(output || generating) && (
            <div className="mt-4 rounded-[20px] border border-[#f0f0f0] bg-[#fafaf9] p-4 sm:mt-5 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <Bot className="size-3.5 text-[#ff6f2c] sm:size-4" />
                <span className="text-[10px] font-semibold text-[#888] sm:text-xs">AI Output</span>
                {generating && (
                  <span className="ml-1 flex items-center gap-1">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="inline-block size-1.5 animate-bounce rounded-full bg-[#ff6f2c]" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </span>
                )}
              </div>
              <div className="space-y-1">{renderOutput(output)}</div>
              {output && !generating && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" className="rounded-full text-xs shadow-none sm:text-sm" onClick={() => navigator.clipboard.writeText(output)}>
                    <Send className="size-3" /> Copy
                  </Button>
                  <Button variant="secondary" className="rounded-full text-xs shadow-none sm:text-sm" onClick={() => window.print()}>
                    Download PDF
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* How it works */}
      {!activeTool && (
        <Card className="rounded-[28px] p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-bold text-[#2d2d2d] sm:mb-4 sm:text-base">How it works</h2>
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            {[
              { step: "1", title: "Pick a tool", desc: "Choose from 6 AI-powered educator tools above." },
              { step: "2", title: "Fill in details", desc: "Enter subject, class, topic and any other needed info." },
              { step: "3", title: "Get AI output", desc: "NVIDIA LLM generates curriculum-aligned content instantly." },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="flex size-7 flex-none items-center justify-center rounded-full bg-[#ff6f2c] text-xs font-extrabold text-white sm:size-8 sm:text-sm">{s.step}</div>
                <div>
                  <div className="text-sm font-bold text-[#2d2d2d]">{s.title}</div>
                  <div className="mt-0.5 text-xs text-[#888]">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
