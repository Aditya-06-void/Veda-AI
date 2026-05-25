"use client";

import { Download, RefreshCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Assignment } from "@/lib/types";

const difficultyVariant = {
  Easy: "success",
  Moderate: "warning",
  Challenging: "danger",
} as const;

export function AssignmentOutput({
  assignment,
  onRegenerate,
  busy,
}: {
  assignment: Assignment;
  onRegenerate: (assignmentId: string) => Promise<void>;
  busy: boolean;
}) {
  const generating =
    assignment.status === "queued" || assignment.status === "generating";

  const paper = assignment.generatedPaper;

  return (
    <div className="space-y-4">
      <Card className="rounded-[32px] bg-[#2a2a2a] px-6 py-6 text-white">
        <p className="max-w-4xl text-[18px] font-bold leading-8">
          {paper?.greeting ??
            `Certainly, ${assignment.title}! We’re preparing a customized question paper for your ${assignment.board} ${assignment.className} ${assignment.subject} assessment.`}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => window.print()}
            className="bg-white text-[#2a2a2a] shadow-none"
            disabled={!paper}
          >
            <Download className="size-4" />
            Download as PDF
          </Button>
          <Button variant="outline" onClick={() => onRegenerate(assignment.id)} disabled={busy}>
            <RefreshCcw className="size-4" />
            Regenerate
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden rounded-[32px] bg-white">
        <div className="px-7 py-10 md:px-10">
          {!paper ? (
            <div className="flex min-h-[800px] flex-col items-center justify-center text-center">
              <div className="mb-4 size-12 animate-spin rounded-full border-4 border-black/10 border-t-black" />
              <h2 className="text-[28px] font-extrabold tracking-[-0.04em] text-[#2d2d2d]">
                {generating ? "Generating question paper..." : "Preparing output"}
              </h2>
              <p className="mt-2 max-w-xl text-[#7b7b7b]">
                We are structuring sections, balancing difficulties, assigning
                marks, and formatting the paper to match the assignment brief.
              </p>
            </div>
          ) : (
            <article id="print-paper" className="mx-auto max-w-[900px] text-[#2d2d2d]">
              <header className="space-y-3 text-center">
                <h1 className="text-[24px] font-extrabold md:text-[28px]">
                  {paper.schoolName}
                </h1>
                <p className="text-[18px] font-bold">Subject: {paper.subject}</p>
                <p className="text-[18px] font-bold">Class: {paper.className}</p>
              </header>

              <div className="mt-10 flex flex-col gap-6 text-[18px] md:flex-row md:justify-between">
                <p className="font-bold">Time Allowed: {paper.timeAllowed}</p>
                <p className="font-bold">Maximum Marks: {paper.maximumMarks}</p>
              </div>

              <p className="mt-8 font-semibold">
                All questions are compulsory unless stated otherwise.
              </p>

              <div className="mt-8 space-y-2 text-[18px]">
                {paper.studentFields.map((field) => (
                  <p key={field}>
                    <span className="font-bold">{field}:</span>{" "}
                    <span className="inline-block w-40 border-b border-[#3b3b3b]" />
                  </p>
                ))}
              </div>

              {paper.sections.map((section, sectionIndex) => (
                <section key={section.id} className="mt-14">
                  <h2 className="text-center text-[34px] font-extrabold tracking-[-0.04em]">
                    Section {String.fromCharCode(65 + sectionIndex)}
                  </h2>
                  <div className="mt-8">
                    <h3 className="text-[26px] font-bold">{section.title}</h3>
                    <p className="text-lg italic text-[#555]">{section.instruction}</p>
                  </div>
                  <ol className="mt-8 space-y-5">
                    {section.questions.map((question) => (
                      <li key={question.id} className="list-decimal text-[18px] leading-8">
                        <div className="ml-2 inline-flex flex-wrap items-center gap-3">
                          <span>{question.text}</span>
                          <Badge
                            variant={difficultyVariant[question.difficulty]}
                            className="align-middle"
                          >
                            {question.difficulty}
                          </Badge>
                          <span className="font-semibold text-[#555]">
                            [{question.marks} Marks]
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}

              <p className="mt-10 text-[18px] font-bold">End of Question Paper</p>

              <section className="mt-16">
                <h2 className="text-[30px] font-extrabold">Answer Key:</h2>
                <ol className="mt-6 space-y-4 text-[17px] leading-8 text-[#333]">
                  {paper.answerKey.map((answer) => (
                    <li key={answer.id} className="list-decimal">
                      <span className="ml-2">{answer.text}</span>
                    </li>
                  ))}
                </ol>
              </section>
            </article>
          )}
        </div>
      </Card>
    </div>
  );
}
