"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, ClipboardCheck, Loader2, Trash2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteEvaluation, fetchEvaluations, submitEvaluation } from "@/lib/api";
import { Evaluation } from "@/lib/types";

function gradeColor(grade: string) {
  if (grade === "A+" || grade === "A") return "text-emerald-600 bg-emerald-50";
  if (grade === "B+" || grade === "B") return "text-blue-600 bg-blue-50";
  if (grade === "C") return "text-yellow-600 bg-yellow-50";
  if (grade === "D") return "text-orange-600 bg-orange-50";
  return "text-red-600 bg-red-50";
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="h-1.5 w-full rounded-full bg-[#f0f0f0]">
      <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function EvaluationCard({ evaluation, onDelete }: { evaluation: Evaluation; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-[#e8e8e8] bg-white p-4 shadow-sm md:p-5">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4f4f4] text-[13px] font-black text-[#333]">
          {evaluation.studentName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-semibold text-[#111]">{evaluation.studentName}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${gradeColor(evaluation.grade)}`}>
              {evaluation.grade}
            </span>
          </div>
          <div className="mt-1 text-[12px] text-[#888]">
            {evaluation.totalMarksAwarded} / {evaluation.totalMaxMarks} marks · {evaluation.percentage}%
          </div>
          <div className="mt-2">
            <ProgressBar value={evaluation.totalMarksAwarded} max={evaluation.totalMaxMarks} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#aaa] transition hover:bg-[#f4f4f4] hover:text-[#333]"
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          <button
            onClick={() => onDelete(evaluation.id)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#ccc] transition hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded question breakdown */}
      {expanded && (
        <div className="mt-4 space-y-3 border-t border-[#f0f0f0] pt-4">
          {evaluation.questions.map((q, i) => (
            <div key={q.questionId} className="rounded-xl border border-[#f0f0f0] bg-[#fafafa] p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[12px] font-semibold text-[#333]">Q{i + 1}. {q.questionText}</span>
                <span className="shrink-0 text-[12px] font-bold text-[#555]">
                  {q.marksAwarded}/{q.maxMarks}
                </span>
              </div>
              {q.studentAnswer && q.studentAnswer !== "(no answer)" && (
                <p className="mt-1.5 text-[11px] text-[#777]">
                  <span className="font-semibold text-[#555]">Student: </span>{q.studentAnswer}
                </p>
              )}
              <p className="mt-1 text-[11px] text-[#888] italic">{q.feedback}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function EvaluatePanel({ assignmentId, open, onClose }: {
  assignmentId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [studentName, setStudentName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setFetching(true);
    fetchEvaluations(assignmentId)
      .then((r) => setEvaluations(r.evaluations))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [open, assignmentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentName.trim() || !file) return;
    setError(null);
    setLoading(true);
    try {
      const { evaluation } = await submitEvaluation(assignmentId, studentName.trim(), file);
      setEvaluations((prev) => [evaluation, ...prev]);
      setStudentName("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(evaluationId: string) {
    await deleteEvaluation(evaluationId);
    setEvaluations((prev) => prev.filter((e) => e.id !== evaluationId));
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center" onClick={onClose}>
      <Card
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border-0 bg-white shadow-2xl md:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f0f0] px-5 py-4 md:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111] text-white">
              <ClipboardCheck className="size-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#111]">Evaluate Answer Sheets</h2>
              <p className="text-[11px] text-[#999]">Upload a student's answer sheet to auto-grade</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-[#aaa] hover:bg-[#f4f4f4] hover:text-[#333]">
            <X className="size-4" />
          </button>
        </div>

        {/* Upload form */}
        <form onSubmit={handleSubmit} className="border-b border-[#f0f0f0] px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#888]">Student Name</label>
              <Input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="h-9 rounded-xl border-[#e0e0e0] text-[13px]"
                disabled={loading}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#888]">Answer Sheet</label>
              <div
                className="flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#d0d0d0] px-3 text-[12px] text-[#888] transition hover:border-[#aaa] hover:bg-[#fafafa]"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-3.5 shrink-0" />
                <span className="truncate">{file ? file.name : "PDF, image, or text file"}</span>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.html"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !studentName.trim() || !file}
              className="h-9 shrink-0 rounded-xl bg-[#111] px-4 text-[13px] font-semibold text-white hover:bg-[#333] disabled:opacity-40"
            >
              {loading ? <><Loader2 className="mr-1.5 size-3.5 animate-spin" />Evaluating…</> : "Evaluate"}
            </Button>
          </div>
          {error && <p className="mt-2 text-[12px] text-red-500">{error}</p>}
        </form>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 md:px-6">
          {fetching ? (
            <div className="flex items-center justify-center py-10 text-[#bbb]">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : evaluations.length === 0 ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="mx-auto mb-2 size-8 text-[#e0e0e0]" />
              <p className="text-[13px] text-[#bbb]">No evaluations yet. Upload an answer sheet above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#aaa]">
                {evaluations.length} evaluation{evaluations.length !== 1 ? "s" : ""}
              </p>
              {evaluations.map((ev) => (
                <EvaluationCard key={ev.id} evaluation={ev} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
