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
  const paper = assignment.generatedPaper;
  const generating =
    assignment.status === "queued" || assignment.status === "generating";

  return (
    <div className="space-y-4">
      <Card className="rounded-[28px] bg-[#2a2a2a] px-4 py-5 text-white md:rounded-[32px] md:px-6 md:py-6">
        <p className="max-w-4xl text-[14px] font-bold leading-6 md:text-[18px] md:leading-8">
          {paper?.greeting ??
            `Certainly, Lakshya! Here are customized Question Paper for your ${assignment.board} ${assignment.className} ${assignment.subject} classes on the requested syllabus.`}
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
        <div className="px-4 py-6 md:px-8 md:py-10">
          {!paper ? (
            <div className="flex min-h-[680px] flex-col items-center justify-center text-center md:min-h-[800px]">
              <div className="mb-4 size-12 animate-spin rounded-full border-4 border-black/10 border-t-black" />
              <h2 className="text-[24px] font-extrabold tracking-[-0.04em] text-[#2d2d2d] md:text-[28px]">
                {generating ? "Generating question paper..." : "Preparing output"}
              </h2>
              <p className="mt-2 max-w-xl text-[#7b7b7b]">
                We are structuring sections, balancing difficulties, assigning
                marks, and formatting the paper to match the assignment brief.
              </p>
            </div>
          ) : (
            <article id="print-paper" className="mx-auto max-w-[900px] text-[#2d2d2d]">
              <header className="space-y-2 text-center md:space-y-3">
                <h1 className="text-[16px] font-extrabold leading-6 md:text-[28px]">
                  {paper.schoolName}
                </h1>
                <p className="text-[14px] font-bold md:text-[18px]">Subject: {paper.subject}</p>
                <p className="text-[14px] font-bold md:text-[18px]">Class: {paper.className}</p>
              </header>

              <div className="mt-8 flex flex-col gap-4 text-[14px] md:mt-10 md:flex-row md:justify-between md:text-[18px]">
                <p className="font-bold">Time Allowed: {paper.timeAllowed}</p>
                <p className="font-bold">Maximum Marks: {paper.maximumMarks}</p>
              </div>

              <p className="mt-6 text-[14px] font-semibold md:mt-8 md:text-[18px]">
                All questions are compulsory unless stated otherwise.
              </p>

              <div className="mt-6 space-y-1 text-[14px] md:mt-8 md:space-y-2 md:text-[18px]">
                {paper.studentFields.map((field) => (
                  <p key={field}>
                    <span className="font-bold">{field}:</span>{" "}
                    <span className="inline-block w-28 border-b border-[#3b3b3b] md:w-40" />
                  </p>
                ))}
              </div>

              {paper.sections.map((section, sectionIndex) => (
                <section key={section.id} className="mt-10 md:mt-14">
                  <h2 className="text-center text-[24px] font-extrabold tracking-[-0.04em] md:text-[34px]">
                    Section {String.fromCharCode(65 + sectionIndex)}
                  </h2>
                  <div className="mt-6 md:mt-8">
                    <h3 className="text-[18px] font-bold md:text-[26px]">{section.title}</h3>
                    <p className="text-sm italic text-[#555] md:text-lg">{section.instruction}</p>
                  </div>
                  <ol className="mt-6 space-y-4 md:mt-8 md:space-y-5">
                    {section.questions.map((question) => (
                      <li key={question.id} className="list-decimal text-[14px] leading-7 md:text-[18px] md:leading-8">
                        <div className="ml-2 inline-flex flex-wrap items-center gap-2 md:gap-3">
                          <span>{question.text}</span>
                          <Badge variant={difficultyVariant[question.difficulty]}>
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

              <p className="mt-10 text-[15px] font-bold md:text-[18px]">End of Question Paper</p>

              <section className="mt-12 md:mt-16">
                <h2 className="text-[22px] font-extrabold md:text-[30px]">Answer Key:</h2>
                <ol className="mt-5 space-y-3 text-[14px] leading-7 text-[#333] md:mt-6 md:text-[17px] md:leading-8">
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
