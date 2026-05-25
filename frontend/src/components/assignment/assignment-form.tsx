"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Minus,
  Paperclip,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { defaultQuestionTypes, questionTypeOptions, schoolProfile } from "@/lib/constants";
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
      {
        id: `qt-${crypto.randomUUID()}`,
        type: questionTypeOptions[0],
        count: 1,
        marks: 1,
      },
    ]);
  }

  function removeQuestionType(id: string) {
    if (questionTypes.length === 1) return;
    setQuestionTypes((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="px-2">
        <div className="flex items-center gap-3">
          <span className="size-4 rounded-full bg-emerald-400 ring-4 ring-emerald-100" />
          <div>
            <h1 className="text-[40px] font-extrabold tracking-[-0.04em] text-[#2d2d2d] max-md:text-3xl">
              Create Assignment
            </h1>
            <p className="text-[#8a8a8a]">Set up a new assignment for your students</p>
          </div>
        </div>
      </div>

      <div className="mx-auto h-1.5 max-w-[800px] overflow-hidden rounded-full bg-white/70">
        <div className="h-full w-1/2 rounded-full bg-[#4a4a4a]" />
      </div>

      <Card className="mx-auto max-w-[790px] rounded-[34px] px-8 py-8 max-md:px-5">
        <div className="mb-8">
          <h2 className="text-[24px] font-extrabold tracking-[-0.04em] text-[#2d2d2d]">
            Assignment Details
          </h2>
          <p className="mt-1 text-[#8b8b8b]">Basic information about your assignment</p>
        </div>

        <form
          className="space-y-8"
          onSubmit={form.handleSubmit(async (values) =>
            onSubmit({
              ...values,
              questionTypes,
              file: selectedFile,
            }),
          )}
        >
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-[#2d2d2d]">
              Upload Material
            </label>
            <div className="rounded-[28px] border border-dashed border-black/15 bg-white px-6 py-12 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-black/5">
                <Paperclip className="size-5 text-[#2d2d2d]" />
              </div>
              <p className="mt-5 text-[28px] font-bold tracking-[-0.04em] text-[#2d2d2d] max-md:text-xl">
                Choose a file or drag & drop it here
              </p>
              <p className="mt-2 text-sm text-[#999]">
                PDF, DOC, PNG or JPEG. Upto 10MB.
              </p>
              <div className="mt-5">
                <label className="inline-flex cursor-pointer items-center rounded-full bg-[#f4f4f4] px-6 py-3 text-sm font-semibold text-[#2d2d2d]">
                  Browse Files
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                    className="hidden"
                    onChange={(event) =>
                      setSelectedFile(event.target.files?.[0] ?? null)
                    }
                  />
                </label>
              </div>
              <p className="mt-4 text-[#8b8b8b]">
                {selectedFile
                  ? `Selected: ${selectedFile.name}`
                  : "Upload images or your preferred document/image"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#2d2d2d]">School Name</label>
              <Input {...form.register("schoolName")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#2d2d2d]">Board</label>
              <Input {...form.register("board")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#2d2d2d]">Class</label>
              <Input {...form.register("className")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#2d2d2d]">Subject</label>
              <Input {...form.register("subject")} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#2d2d2d]">Due Date</label>
            <div className="relative">
              <Input type="date" {...form.register("dueDate")} className="pr-12" />
              <CalendarDays className="absolute top-1/2 right-4 size-5 -translate-y-1/2 text-[#444]" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-[minmax(0,1fr)_120px_100px_48px] items-center gap-4 text-sm font-semibold text-[#2d2d2d] max-md:hidden">
              <span>Question Type</span>
              <span className="text-center">No. of Questions</span>
              <span className="text-center">Marks</span>
              <span />
            </div>

            {questionTypes.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_100px_48px] md:items-center"
              >
                <Select
                  value={item.type}
                  onValueChange={(value) => updateQuestionType(item.id, { type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center justify-between rounded-full border border-black/8 bg-white px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuestionType(item.id, {
                        count: Math.max(1, item.count - 1),
                      })
                    }
                  >
                    <Minus className="size-4 text-[#909090]" />
                  </button>
                  <span className="font-semibold text-[#2d2d2d]">{item.count}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuestionType(item.id, {
                        count: Math.max(1, item.count + 1),
                      })
                    }
                  >
                    <Plus className="size-4 text-[#909090]" />
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-full border border-black/8 bg-white px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuestionType(item.id, {
                        marks: Math.max(1, item.marks - 1),
                      })
                    }
                  >
                    <Minus className="size-4 text-[#909090]" />
                  </button>
                  <span className="font-semibold text-[#2d2d2d]">{item.marks}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuestionType(item.id, {
                        marks: Math.max(1, item.marks + 1),
                      })
                    }
                  >
                    <Plus className="size-4 text-[#909090]" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeQuestionType(item.id)}
                  className="flex size-12 items-center justify-center rounded-full border border-black/8 bg-white text-[#2d2d2d]"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addQuestionType}
              className="flex items-center gap-3 text-sm font-bold text-[#2d2d2d]"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-[#2c2c2c] text-white">
                <Plus className="size-4" />
              </span>
              Add Question Type
            </button>
          </div>

          <div className="flex justify-end">
            <div className="space-y-1 text-right text-[16px] text-[#2d2d2d]">
              <p>Total Questions : {totals.questions}</p>
              <p>Total Marks : {totals.marks}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#2d2d2d]">
              Additional Information (For better output)
            </label>
            <Textarea
              {...form.register("instructions")}
              placeholder="Generate a question paper for a 3 hour exam duration..."
            />
          </div>

          <div className="flex items-center justify-between pt-6">
            <Button type="button" variant="secondary" onClick={onCancel}>
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button type="submit" disabled={submitting}>
              <Sparkles className="size-4" />
              {submitting ? "Generating..." : "Next"}
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
