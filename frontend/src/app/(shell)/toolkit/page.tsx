"use client";

import {
  BookOpen,
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
  Zap,
} from "lucide-react";
import { useState } from "react";

import { MobileHeader } from "@/components/layout/mobile-header";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    label: "Lesson Plan Generator",
    description: "AI-crafted lesson plans aligned to your syllabus",
    icon: BookOpen,
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
    icon: Zap,
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
    label: "Study Guide Creator",
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
    icon: ClipboardList,
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

function ToolCard({
  tool,
  selected,
  onSelect,
}: {
  tool: Tool;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group w-full rounded-[24px] p-5 text-left transition-all",
        selected
          ? "ring-2 shadow-lg"
          : "bg-white/80 hover:shadow-md active:scale-[0.98]",
      )}
      style={selected ? { background: tool.bg, outline: `2px solid ${tool.color}`, outlineOffset: "0px" } : {}}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex size-11 items-center justify-center rounded-2xl"
          style={{ background: selected ? "white" : tool.bg }}
        >
          <tool.icon className="size-5" style={{ color: tool.color }} />
        </div>
        {selected && (
          <span
            className="flex size-6 items-center justify-center rounded-full text-white"
            style={{ background: tool.color }}
          >
            <Star className="size-3 fill-white" />
          </span>
        )}
      </div>
      <div className="mt-3 font-bold text-[#2d2d2d]">{tool.label}</div>
      <div className="mt-0.5 text-xs text-[#888] leading-relaxed">{tool.description}</div>
      <div
        className="mt-3 flex items-center gap-1 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100"
        style={{ color: tool.color }}
      >
        Use tool <ChevronRight className="size-3" />
      </div>
    </button>
  );
}

function renderOutput(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("## ")) return <h2 key={i} className="mt-4 mb-1 text-[16px] font-extrabold text-[#2d2d2d]">{line.slice(3)}</h2>;
    if (line.startsWith("# ")) return <h1 key={i} className="mt-4 mb-2 text-[18px] font-extrabold text-[#2d2d2d]">{line.slice(2)}</h1>;
    if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-bold text-[#2d2d2d]">{line.slice(2, -2)}</p>;
    if (line.startsWith("- ") || line.startsWith("• ")) return <li key={i} className="ml-4 text-sm text-[#444] list-disc">{line.slice(2)}</li>;
    if (line.match(/^\d+\./)) return <li key={i} className="ml-4 text-sm text-[#444] list-decimal">{line.replace(/^\d+\.\s*/, "")}</li>;
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return <p key={i} className="text-sm text-[#444] leading-relaxed">{line}</p>;
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
      const response = await fetch("/api/toolkit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: activeTool.id, ...inputs }),
      });

      if (!response.ok) {
        const err = await response.json() as { error?: string };
        throw new Error(err.error ?? "Generation failed");
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
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
            const token = parsed.choices?.[0]?.delta?.content ?? "";
            if (token) setOutput((prev) => prev + token);
          } catch {
            // ignore parse errors on non-JSON lines
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
      <Card className="rounded-[28px] bg-[#2a2a2a] px-6 py-5 text-white">
        <div className="flex items-start gap-4">
          <div className="flex size-12 flex-none items-center justify-center rounded-2xl bg-[#ff6f2c]/20">
            <Bot className="size-6 text-[#ff6f2c]" />
          </div>
          <div>
            <h1 className="text-[22px] font-extrabold">AI Teacher's Toolkit</h1>
            <p className="mt-1 text-sm text-white/60">
              6 AI-powered tools to save hours of prep — powered by NVIDIA LLM
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Lesson Plans", "Quizzes", "Student Feedback", "Study Guides", "Rubrics", "Explainers"].map((tag) => (
            <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
              {tag}
            </span>
          ))}
        </div>
      </Card>

      {/* Tool grid */}
      <div>
        <h2 className="mb-3 px-1 text-[15px] font-bold text-[#2d2d2d]">
          {activeTool ? `Selected: ${activeTool.label}` : "Choose a Tool"}
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              selected={activeTool?.id === tool.id}
              onSelect={() => handleSelectTool(tool)}
            />
          ))}
        </div>
      </div>

      {/* Active tool panel */}
      {activeTool && (
        <Card className="rounded-[28px] p-5">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex size-10 items-center justify-center rounded-2xl"
                style={{ background: activeTool.bg }}
              >
                <activeTool.icon className="size-5" style={{ color: activeTool.color }} />
              </div>
              <div>
                <div className="font-bold text-[#2d2d2d]">{activeTool.label}</div>
                <div className="text-xs text-[#888]">{activeTool.description}</div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex size-8 items-center justify-center rounded-full text-[#aaa] hover:bg-[#f3f3f3] hover:text-[#2d2d2d]"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Input fields */}
          <div className="grid gap-3 sm:grid-cols-2">
            {activeTool.fields.map((field) => (
              <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                <label className="mb-1 block text-xs font-semibold text-[#888]">{field.label}</label>
                {field.type === "select" ? (
                  <select
                    value={inputs[field.key] ?? ""}
                    onChange={(e) => setInputs({ ...inputs, [field.key]: e.target.value })}
                    className="w-full rounded-2xl border border-[#e8e8e8] bg-[#f8f8f7] px-4 py-2.5 text-sm outline-none focus:border-[#ff6f2c]"
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
                    className="w-full rounded-2xl border border-[#e8e8e8] bg-[#f8f8f7] px-4 py-2.5 text-sm outline-none focus:border-[#ff6f2c] resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={inputs[field.key] ?? ""}
                    onChange={(e) => setInputs({ ...inputs, [field.key]: e.target.value })}
                    className="w-full rounded-2xl border border-[#e8e8e8] bg-[#f8f8f7] px-4 py-2.5 text-sm outline-none focus:border-[#ff6f2c]"
                  />
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="mt-4 rounded-full bg-[#2a2a2a] px-8"
            style={generating ? {} : { background: activeTool.color }}
          >
            {generating ? (
              <>
                <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generate with AI
              </>
            )}
          </Button>

          {error && (
            <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          )}

          {/* Output area */}
          {(output || generating) && (
            <div className="mt-5 rounded-[20px] border border-[#f0f0f0] bg-[#fafaf9] p-5">
              <div className="mb-3 flex items-center gap-2">
                <Bot className="size-4 text-[#ff6f2c]" />
                <span className="text-xs font-semibold text-[#888]">AI Output</span>
                {generating && (
                  <span className="ml-1 flex items-center gap-1 text-xs text-[#ff6f2c]">
                    <span className="inline-block size-1.5 animate-bounce rounded-full bg-[#ff6f2c]" />
                    <span className="inline-block size-1.5 animate-bounce rounded-full bg-[#ff6f2c] [animation-delay:0.15s]" />
                    <span className="inline-block size-1.5 animate-bounce rounded-full bg-[#ff6f2c] [animation-delay:0.3s]" />
                  </span>
                )}
              </div>
              <div className="space-y-1 text-[#2d2d2d]">{renderOutput(output)}</div>
              {output && !generating && (
                <div className="mt-4 flex gap-3">
                  <Button
                    variant="secondary"
                    className="rounded-full text-sm shadow-none"
                    onClick={() => navigator.clipboard.writeText(output)}
                  >
                    <Send className="size-3" />
                    Copy
                  </Button>
                  <Button
                    variant="secondary"
                    className="rounded-full text-sm shadow-none"
                    onClick={() => window.print()}
                  >
                    Download PDF
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Tips row */}
      {!activeTool && (
        <Card className="rounded-[28px] p-5">
          <h2 className="mb-4 font-bold text-[#2d2d2d]">How it works</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { step: "1", title: "Pick a tool", desc: "Choose from 6 AI-powered educator tools above." },
              { step: "2", title: "Fill in details", desc: "Enter subject, class, topic and any other needed info." },
              { step: "3", title: "Get AI output", desc: "NVIDIA LLM generates curriculum-aligned content instantly." },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="flex size-8 flex-none items-center justify-center rounded-full bg-[#ff6f2c] text-sm font-extrabold text-white">
                  {s.step}
                </div>
                <div>
                  <div className="font-bold text-[#2d2d2d]">{s.title}</div>
                  <div className="mt-0.5 text-sm text-[#888]">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
