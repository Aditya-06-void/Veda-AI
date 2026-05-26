"use client";

import { CheckCircle2, Download, FileText, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Assignment, GeneratedPaper } from "@/lib/types";

// ── MCQ option parser ────────────────────────────────────────────────────────
// Handles both actual newlines and literal \n stored in DB.
function parseMCQOptions(raw: string): { stem: string; options: string[] } | null {
  const text = raw.replace(/\\n/g, "\n");
  const parts = text.split(/\s+(?=[A-D][).]\s)/);
  if (parts.length < 3) return null;
  const options = parts.slice(1).map((s) => s.trim());
  if (!options.every((s) => /^[A-D][).]\s/.test(s))) return null;
  return { stem: parts[0].trim(), options };
}

function QuestionText({ text }: { text: string }) {
  const parsed = parseMCQOptions(text);
  if (parsed) {
    return (
      <span>
        <span className="block">{parsed.stem}</span>
        <span className="mt-2 block space-y-1 pl-2 md:pl-4">
          {parsed.options.map((opt, i) => (
            <span key={i} className="block">{opt}</span>
          ))}
        </span>
      </span>
    );
  }
  // Render literal \n as line breaks for non-MCQ questions
  const lines = text.replace(/\\n/g, "\n").split("\n");
  return (
    <span>
      {lines.map((line, i) => (
        <span key={i} className="block">{line}</span>
      ))}
    </span>
  );
}

// ── PDF printer ──────────────────────────────────────────────────────────────
// Opens a dedicated print window — avoids all visibility-hack CSS conflicts.
function printPaper(paper: GeneratedPaper) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("Pop-up blocked. Please allow pop-ups for this site and try again.");
    return;
  }

  let globalQ = 0;

  const sectionsHTML = paper.sections
    .map((section, sIdx) => {
      const questionsHTML = section.questions
        .map((q) => {
          globalQ += 1;
          const parsed = parseMCQOptions(q.text);
          const body = parsed
            ? `${parsed.stem}<div style="margin-top:6px;padding-left:18px;">${parsed.options.map((o) => `<div style="margin-bottom:3px;">${o}</div>`).join("")}</div>`
            : q.text;
          return `<li style="display:flex;gap:10px;margin-bottom:14px;font-size:11.5pt;line-height:1.75;">
            <span style="flex-shrink:0;font-weight:700;min-width:20px;">${globalQ}.</span>
            <div style="flex:1;">${body}</div>
            <span style="flex-shrink:0;font-weight:600;color:#555;padding-top:2px;">[${q.marks}]</span>
          </li>`;
        })
        .join("");

      return `<section style="margin-top:32px;">
        <div style="border-top:1px solid #bbb;border-bottom:1px solid #bbb;padding:7px 0;text-align:center;">
          <div style="font-size:12pt;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">
            Section ${String.fromCharCode(65 + sIdx)}: ${section.title}
          </div>
          <div style="font-size:10.5pt;font-style:italic;color:#666;margin-top:3px;">${section.instruction}</div>
        </div>
        <ol style="margin:14px 0 0;padding:0;list-style:none;">${questionsHTML}</ol>
      </section>`;
    })
    .join("");

  const studentFieldsHTML = paper.studentFields
    .map(
      (f) =>
        `<span style="margin-right:32px;"><strong>${f}:</strong> <span style="display:inline-block;width:120px;border-bottom:1px solid #000;">&nbsp;</span></span>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>${paper.schoolName} – Question Paper</title>
  <style>
    @page { size: A4; margin: 2cm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 12pt;
      color: #000;
      background: #fff;
    }
  </style>
</head>
<body>
  <header style="border-bottom:2.5px solid #111;padding-bottom:14px;text-align:center;margin-bottom:14px;">
    <h1 style="font-size:20pt;font-weight:900;text-transform:uppercase;letter-spacing:0.06em;">${paper.schoolName}</h1>
    <div style="font-size:13pt;margin-top:8px;">
      <strong>Subject:</strong> ${paper.subject}&nbsp;&nbsp;|&nbsp;&nbsp;<strong>Class:</strong> ${paper.className}
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:10px;font-size:11.5pt;font-weight:600;">
      <span>Time Allowed: ${paper.timeAllowed}</span>
      <span>Maximum Marks: ${paper.maximumMarks}</span>
    </div>
  </header>

  <div style="border-bottom:1px solid #ccc;padding-bottom:12px;margin-bottom:4px;font-size:11pt;">
    <p style="font-style:italic;color:#555;margin-bottom:8px;">All questions are compulsory unless stated otherwise.</p>
    <div>${studentFieldsHTML}</div>
  </div>

  ${sectionsHTML}

  <p style="margin-top:36px;border-top:1px solid #ccc;padding-top:14px;text-align:center;font-size:11pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">
    *** End of Question Paper ***
  </p>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
  win.focus();
  // Small delay so the browser fully renders before print dialog opens
  setTimeout(() => {
    win.print();
    win.close();
  }, 600);
}

// ── Component ────────────────────────────────────────────────────────────────
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

  let globalQ = 0;

  return (
    <div className="space-y-4">
      {/* ── Greeting card (hidden when printing) ── */}
      <Card className="rounded-[28px] bg-[#2a2a2a] px-4 py-5 text-white md:rounded-4xl md:px-6 md:py-6 print:hidden">
        <p className="max-w-4xl text-[14px] font-bold leading-6 md:text-[18px] md:leading-8">
          {paper?.greeting ??
            `Generating your ${assignment.board} ${assignment.className} ${assignment.subject} question paper…`}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => paper && printPaper(paper)}
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

          {/* Auto-save indicator */}
          {assignment.status === "completed" && (
            <div className="ml-auto flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              Saved to database
            </div>
          )}
        </div>

        {/* Source file indicator */}
        {assignment.fileName && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-white/50">
            <FileText className="size-3" />
            Source: {assignment.fileName}
          </div>
        )}
      </Card>

      {/* ── Paper card ── */}
      <Card className="overflow-hidden rounded-4xl border-[1.5px] border-[#d4d4d4] bg-white shadow-sm">
        <div className="px-4 py-6 md:px-10 md:py-10">
          {!paper ? (
            <div className="flex min-h-170 flex-col items-center justify-center text-center md:min-h-200">
              <div className="mb-4 size-12 animate-spin rounded-full border-4 border-black/10 border-t-black" />
              <h2 className="text-[24px] font-extrabold tracking-[-0.04em] text-[#2d2d2d] md:text-[28px]">
                {generating ? "Generating question paper…" : "Preparing output"}
              </h2>
              <p className="mt-2 max-w-xl text-[#7b7b7b]">
                Structuring sections, balancing difficulty, assigning marks, and formatting your paper.
              </p>
            </div>
          ) : (
            <article className="mx-auto max-w-3xl rounded-2xl border border-[#e0e0e0] bg-white px-5 py-7 font-serif text-[#111] shadow-[0_1px_8px_rgba(0,0,0,0.06)] md:px-10 md:py-10">
              {/* ── Header ── */}
              <header className="border-b-2 border-[#111] pb-5 text-center">
                <h1 className="text-[18px] font-black uppercase tracking-wider text-[#111] md:text-[24px]">
                  {paper.schoolName}
                </h1>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px] md:text-[14px]">
                  <span><strong>Subject:</strong> {paper.subject}</span>
                  <span className="text-[#bbb]">|</span>
                  <span><strong>Class:</strong> {paper.className}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold md:text-[13px]">
                  <span>Time Allowed: {paper.timeAllowed}</span>
                  <span>Maximum Marks: {paper.maximumMarks}</span>
                </div>
              </header>

              {/* ── Instructions + student fields ── */}
              <div className="mt-4 space-y-3 border-b border-[#e0e0e0] pb-4 text-[11px] md:text-[12px]">
                <p className="italic text-[#666]">All questions are compulsory unless stated otherwise.</p>
                <div className="flex flex-wrap gap-x-8 gap-y-2">
                  {paper.studentFields.map((field) => (
                    <p key={field}>
                      <span className="font-semibold">{field}:</span>{" "}
                      <span className="inline-block w-28 border-b border-[#111] align-bottom md:w-40" />
                    </p>
                  ))}
                </div>
              </div>

              {/* ── Sections ── */}
              {paper.sections.map((section, sIdx) => (
                <section key={section.id} className="mt-7 md:mt-9">
                  <div className="border-y border-[#ccc] py-2 text-center">
                    <h2 className="text-[11px] font-extrabold uppercase tracking-widest md:text-[13px]">
                      Section {String.fromCharCode(65 + sIdx)}: {section.title}
                    </h2>
                    <p className="mt-0.5 text-[10px] italic text-[#777] md:text-[11px]">
                      {section.instruction}
                    </p>
                  </div>

                  <ol className="mt-4 space-y-4">
                    {section.questions.map((question) => {
                      globalQ += 1;
                      const qNum = globalQ;
                      return (
                        <li
                          key={question.id}
                          className="flex gap-3 text-[12px] leading-7 md:text-[13px] md:leading-8"
                        >
                          <span className="shrink-0 font-bold">{qNum}.</span>
                          <div className="flex-1">
                            <QuestionText text={question.text} />
                          </div>
                          <span className="shrink-0 self-start pt-0.5 font-semibold text-[#666]">
                            [{question.marks}]
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              ))}

              {/* ── End of paper ── */}
              <p className="mt-10 border-t border-[#e0e0e0] pt-4 text-center text-[10px] font-bold uppercase tracking-widest text-[#444] md:text-[11px]">
                *** End of Question Paper ***
              </p>

              {/* ── Answer Key (screen only) ── */}
              <section className="mt-8 rounded-2xl border border-[#e8e8e8] bg-[#f8f8f8] px-5 py-6 md:px-7 md:py-7">
                <h2 className="text-[16px] font-extrabold tracking-[-0.02em] text-[#2d2d2d] md:text-[20px]">
                  Answer Key
                </h2>
                <p className="mb-4 mt-1 text-[11px] text-[#aaa] md:text-[12px]">
                  Not included in the downloaded PDF.
                </p>
                <ol className="space-y-3 text-[11px] leading-7 text-[#333] md:text-[13px] md:leading-8">
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
