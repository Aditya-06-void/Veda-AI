"use client";

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  boardOptions,
  classOptions,
  defaultQuestionTypes,
  questionTypeOptions,
  schoolProfile,
  subjectOptions,
} from "@/lib/constants";
import { AssignmentFormValues, QuestionTypeItem } from "@/lib/types";
import { toInputDate } from "@/lib/utils";

const defaultDueDate = "2026-05-30";

const formSchema = z.object({
  schoolName: z.string().min(2),
  board: z.string().min(2),
  className: z.string().min(1),
  subject: z.string().min(2),
  dueDate: z.string().min(1),
  instructions: z.string().min(10),
});

type Props = {
  onSubmit: (values: AssignmentFormValues) => Promise<void>;
  submitting: boolean;
  onCancel: () => void;
};

function totalFrom(questionTypes: QuestionTypeItem[]) {
  return questionTypes.reduce(
    (acc, item) => {
      acc.questions += item.count;
      acc.marks += item.count * item.marks;
      return acc;
    },
    { questions: 0, marks: 0 },
  );
}

function QuantityControl({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-full border border-black/8 bg-white px-4 py-3">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))}>
        <Minus className="size-4 text-[#b0b0b0]" />
      </button>
      <span className="font-semibold text-[#2d2d2d]">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)}>
        <Plus className="size-4 text-[#b0b0b0]" />
      </button>
    </div>
  );
}

export function AssignmentForm({ onSubmit, submitting, onCancel }: Props) {
  const [questionTypes, setQuestionTypes] = useState<QuestionTypeItem[]>(defaultQuestionTypes);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const totals = useMemo(() => totalFrom(questionTypes), [questionTypes]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      schoolName: schoolProfile.schoolName,
      board: "CBSE",
      className: "Grade 8",
      subject: "Science",
      dueDate: toInputDate(defaultDueDate),
      instructions:
        "Generate a question paper for a 45 minute assessment with a clean progression from concept recall to application-based questions.",
    },
  });

  function updateQuestionType(id: string, patch: Partial<QuestionTypeItem>) {
    setQuestionTypes((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function addQuestionType() {
    setQuestionTypes((current) => [
      ...current,
      { id: `qt-${crypto.randomUUID()}`, type: questionTypeOptions[0], count: 4, marks: 4 },
    ]);
  }

  function removeQuestionType(id: string) {
    if (questionTypes.length === 1) return;
    setQuestionTypes((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="px-1">
        <div className="flex items-center gap-3">
          <span className="size-4 rounded-full bg-emerald-400 ring-4 ring-emerald-100" />
          <div>
            <h1 className="text-[20px] font-extrabold tracking-[-0.04em] text-[#2d2d2d] md:text-[40px]">
              Create Assignment
            </h1>
            <p className="text-[#8a8a8a]">Set up a new assignment for your students</p>
          </div>
        </div>
      </div>

      <div className="mx-auto h-1.5 max-w-201 overflow-hidden rounded-full bg-white/70">
        <div className="h-full w-1/2 rounded-full bg-[#5b5b5b]" />
      </div>

      <Card className="mx-auto max-w-199 rounded-[34px] px-5 py-7 md:px-8">
        <div className="mb-7">
          <h2 className="text-[18px] font-extrabold tracking-[-0.04em] text-[#2d2d2d] md:text-[24px]">
            Assignment Details
          </h2>
          <p className="mt-1 text-[#8b8b8b]">Basic information about your assignment</p>
        </div>

        <form
          className="space-y-8"
          onSubmit={form.handleSubmit(async (values) =>
            onSubmit({ ...values, questionTypes, file: selectedFile }),
          )}
        >
          {/* File upload */}
          <div className="rounded-[28px] border border-dashed border-black/12 bg-white px-4 py-7 text-center md:px-6 md:py-12">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-black/5">
              <Upload className="size-5 text-[#2d2d2d]" />
            </div>
            <p className="mt-4 text-[16px] font-semibold text-[#2d2d2d] md:mt-5 md:text-[20px]">
              Choose a file or drag & drop it here
            </p>
            <p className="mt-2 text-sm text-[#999]">PDF, TXT, CSV — up to 10 MB</p>
            <div className="mt-5">
              <label className="inline-flex cursor-pointer items-center rounded-full bg-[#f4f4f4] px-6 py-3 text-sm font-semibold text-[#2d2d2d]">
                Browse Files
                <input
                  type="file"
                  accept=".pdf,.txt,.csv"
                  className="hidden"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <p className="mt-4 text-[#8b8b8b]">
              {selectedFile ? `Selected: ${selectedFile.name}` : "Upload a PDF or text file to use as source material"}
            </p>
          </div>

          {/* Fields grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* School Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#2d2d2d]">School Name</label>
              <Input {...form.register("schoolName")} />
            </div>

            {/* Board — dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#2d2d2d]">Board</label>
              <Controller
                name="board"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select board" />
                    </SelectTrigger>
                    <SelectContent>
                      {boardOptions.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Class — dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#2d2d2d]">Class</label>
              <Controller
                name="className"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classOptions.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Subject — dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#2d2d2d]">Subject</label>
              <Controller
                name="subject"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectOptions.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Due date */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#2d2d2d]">Due Date</label>
            <div className="relative">
              <Input type="date" {...form.register("dueDate")} className="pr-12" />
              <CalendarDays className="absolute top-1/2 right-4 size-5 -translate-y-1/2 text-[#444]" />
            </div>
          </div>

          {/* Question types */}
          <div className="space-y-4">
            <div className="hidden grid-cols-[minmax(0,1fr)_116px_100px_40px] gap-4 text-sm font-semibold text-[#2d2d2d] md:grid">
              <span>Question Type</span>
              <span className="text-center">No. of Questions</span>
              <span className="text-center">Marks</span>
              <span />
            </div>

            {questionTypes.map((item) => (
              <div key={item.id}>
                {/* Desktop row */}
                <div className="hidden grid-cols-[minmax(0,1fr)_116px_100px_40px] gap-4 md:grid md:items-center">
                  <Select value={item.type} onValueChange={(value) => updateQuestionType(item.id, { type: value })}>
                    <SelectTrigger><SelectValue placeholder="Select question type" /></SelectTrigger>
                    <SelectContent>
                      {questionTypeOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <QuantityControl value={item.count} onChange={(next) => updateQuestionType(item.id, { count: next })} />
                  <QuantityControl value={item.marks} onChange={(next) => updateQuestionType(item.id, { marks: next })} />
                  <button type="button" onClick={() => removeQuestionType(item.id)}>
                    <X className="size-4 text-[#555]" />
                  </button>
                </div>

                {/* Mobile card */}
                <Card className="rounded-3xl p-4 md:hidden">
                  <div className="flex items-center gap-3">
                    <Select value={item.type} onValueChange={(value) => updateQuestionType(item.id, { type: value })}>
                      <SelectTrigger className="border-none px-0 shadow-none">
                        <SelectValue placeholder="Select question type" />
                      </SelectTrigger>
                      <SelectContent>
                        {questionTypeOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button type="button" onClick={() => removeQuestionType(item.id)}>
                      <X className="size-4 text-[#555]" />
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-[20px] bg-[#f7f7f7] p-3">
                    <div>
                      <div className="mb-2 text-sm text-[#555]">No. of Questions</div>
                      <QuantityControl value={item.count} onChange={(next) => updateQuestionType(item.id, { count: next })} />
                    </div>
                    <div>
                      <div className="mb-2 text-sm text-[#555]">Marks</div>
                      <QuantityControl value={item.marks} onChange={(next) => updateQuestionType(item.id, { marks: next })} />
                    </div>
                  </div>
                </Card>
              </div>
            ))}

            <button
              type="button"
              onClick={addQuestionType}
              className="flex items-center gap-3 text-sm font-bold text-[#2d2d2d]"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-[#2c2c2c] text-white">
                <Plus className="size-4" />
              </span>
              Add Question Type
            </button>
          </div>

          {/* Totals */}
          <div className="text-right text-[16px] text-[#2d2d2d]">
            <p>Total Questions : {totals.questions}</p>
            <p>Total Marks : {totals.marks}</p>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#2d2d2d]">
              Additional Information (For better output)
            </label>
            <Textarea
              {...form.register("instructions")}
              placeholder="e.g Generate a question paper for 3 hour exam duration..."
            />
          </div>

          {/* Nav buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="secondary" onClick={onCancel}>
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Generating..." : "Next"}
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
