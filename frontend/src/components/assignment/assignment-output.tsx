"use client";

import { Download, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Assignment } from "@/lib/types";

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
  const generating = assignment.status === "queued" || assignment.status === "generating";

  // Running question number across all sections
  let globalQ = 0;

  return (
    <div className="space-y-4">
      {/* ── Greeting card ── */}
      <Card className="rounded-[28px] bg-[#2a2a2a] px-4 py-5 text-white md:rounded-[32px] md:px-6 md:py-6 print:hidden">
        <p className="max-w-4xl text-[14px] font-bold leading-6 md:text-[18px] md:leading-8">
          {paper?.greeting ??
            `Generating your ${assignment.board} ${assignment.className} ${assignment.subject} question paper…`}
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
          <Button
            variant="outline"
            onClick={() => onRegenerate(assignment.id)}
            disabled={busy || generating}
          >
            <RefreshCcw className="size-4" />
            Regenerate
          </Button>
        </div>
      </Card>

      {/* ── Paper card ── */}
      <Card className="overflow-hidden rounded-[32px] bg-white">
        <div className="px-4 py-6 md:px-10 md:py-10">
          {!paper ? (
            <div className="flex min-h-[680px] flex-col items-center justify-center text-center md:min-h-[800px]">
              <div className="mb-4 size-12 animate-spin rounded-full border-4 border-black/10 border-t-black" />
              <h2 className="text-[24px] font-extrabold tracking-[-0.04em] text-[#2d2d2d] md:text-[28px]">
                {generating ? "Generating question paper…" : "Preparing output"}
              </h2>
              <p className="mt-2 max-w-xl text-[#7b7b7b]">
                Structuring sections, balancing difficulty, assigning marks, and formatting your paper.
              </p>
            </div>
          ) : (
            <article
              id="print-paper"
              className="mx-auto max-w-3xl font-serif text-[#111]"
            >
              {/* ── Paper header ── */}
              <header className="border-b-2 border-[#111] pb-5 text-center">
                <h1 className="text-[20px] font-black uppercase tracking-wider md:text-[26px]">
                  {paper.schoolName}
                </h1>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[13px] md:text-[15px]">
                  <span><strong>Subject:</strong> {paper.subject}</span>
                  <span className="text-[#aaa]">|</span>
                  <span><strong>Class:</strong> {paper.className}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[12px] font-semibold md:text-[14px]">
                  <span>Time Allowed: {paper.timeAllowed}</span>
                  <span>Maximum Marks: {paper.maximumMarks}</span>
                </div>
              </header>

              {/* ── Instructions + student fields ── */}
              <div className="mt-4 space-y-3 border-b border-[#ddd] pb-4 text-[12px] md:text-[13px]">
                <p className="italic text-[#444]">All questions are compulsory unless stated otherwise.</p>
                <div className="flex flex-wrap gap-x-8 gap-y-2">
                  {paper.studentFields.map((field) => (
                    <p key={field}>
                      <span className="font-semibold">{field}:</span>{" "}
                      <span className="inline-block w-32 border-b border-[#111] align-bottom md:w-44" />
                    </p>
                  ))}
                </div>
              </div>

              {/* ── Sections ── */}
              {paper.sections.map((section, sIdx) => (
                <section key={section.id} className="mt-8 md:mt-10">
                  {/* Section heading */}
                  <div className="border-y border-[#ccc] py-2 text-center">
                    <h2 className="text-[13px] font-extrabold uppercase tracking-widest md:text-[15px]">
                      Section {String.fromCharCode(65 + sIdx)}: {section.title}
                    </h2>
                    <p className="mt-0.5 text-[11px] italic text-[#666] md:text-[12px]">
                      {section.instruction}
                    </p>
                  </div>

                  {/* Questions */}
                  <ol className="mt-4 space-y-5">
                    {section.questions.map((question) => {
                      globalQ += 1;
                      const qNum = globalQ;
                      return (
                        <li
                          key={question.id}
                          className="flex gap-3 text-[13px] leading-7 md:text-[14px] md:leading-8"
                        >
                          <span className="shrink-0 font-bold">{qNum}.</span>
                          <span className="flex-1">{question.text}</span>
                          <span className="shrink-0 self-start pt-0.5 font-semibold text-[#555]">
                            [{question.marks}]
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              ))}

              {/* ── End of paper ── */}
              <p className="mt-10 border-t border-[#ddd] pt-4 text-center text-[12px] font-bold uppercase tracking-widest md:text-[13px]">
                *** End of Question Paper ***
              </p>

              {/* ── Answer Key (screen only) ── */}
              <section className="print:hidden mt-10 rounded-[20px] bg-[#f7f7f7] px-5 py-6 md:px-8 md:py-8">
                <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-[#2d2d2d] md:text-[22px]">
                  Answer Key
                </h2>
                <p className="mb-4 text-[12px] text-[#999] md:text-[13px]">
                  Hidden in the printed / PDF version.
                </p>
                <ol className="space-y-3 text-[12px] leading-7 text-[#333] md:text-[14px] md:leading-8">
                  {paper.answerKey.map((answer, idx) => (
                    <li key={answer.id} className="flex gap-3">
                      <span className="shrink-0 font-bold">{idx + 1}.</span>
                      <span>{answer.text}</span>
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
