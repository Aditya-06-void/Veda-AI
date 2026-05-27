import OpenAI from "openai";
import crypto from "crypto";
import chalk from "chalk";

import { config } from "./config";
import type { Evaluation, GeneratedPaper, QuestionEvaluation } from "./types";

const openai = new OpenAI({
  apiKey: config.nvidiaApiKey,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

const VISION_MODELS = [
  "meta/llama-3.2-90b-vision-instruct",
  "meta/llama-3.2-11b-vision-instruct",
] as const;

const TEXT_MODEL = "meta/llama-3.3-70b-instruct";

function gradeFromPercentage(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

function extractJson(raw: string): string {
  let s = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) s = s.slice(start, end + 1);
  return s;
}

function buildAnswerKey(paper: GeneratedPaper): { id: string; text: string; marks: number }[] {
  const marksByQuestion = new Map<string, number>();
  for (const section of paper.sections) {
    for (const q of section.questions) {
      marksByQuestion.set(q.id, q.marks);
    }
  }
  return paper.answerKey.map((a) => ({
    id: a.id,
    text: a.text,
    marks: marksByQuestion.get(a.id) ?? 1,
  }));
}

function buildEvalPrompt(
  answerKey: { id: string; text: string; marks: number }[],
  studentText: string,
): string {
  const keyBlock = answerKey
    .map((a, i) => `Q${i + 1} [id:${a.id}, max:${a.marks}]: ${a.text}`)
    .join("\n");

  return `You are a strict but fair school examiner. Evaluate the student's answer sheet against the answer key below.

=== ANSWER KEY ===
${keyBlock}
=== END ANSWER KEY ===

=== STUDENT ANSWERS ===
${studentText}
=== END STUDENT ANSWERS ===

For each question in the answer key, find the student's answer (match by question number or best effort), evaluate it, and award partial marks where appropriate.

Reply with ONLY a JSON array — no markdown, no preamble:
[{"questionId":string,"questionText":string,"studentAnswer":string,"expectedAnswer":string,"marksAwarded":number,"maxMarks":number,"feedback":string}]

Rules:
- marksAwarded must be between 0 and maxMarks
- feedback must be 1 short sentence explaining the mark
- If the student did not answer a question, studentAnswer should be "(no answer)" and marksAwarded should be 0
- Be strict but fair — award partial marks for partially correct answers`;
}

async function extractTextFromImage(imageBase64: string, mimeType: string): Promise<string> {
  for (const model of VISION_MODELS) {
    try {
      console.log(chalk.cyan(`→ Vision OCR using ${model}`));
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${imageBase64}` },
              },
              {
                type: "text",
                text: "This is a student's handwritten or printed answer sheet. Transcribe all the text exactly as written, preserving question numbers and answers. Output plain text only.",
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      });
      const text = completion.choices[0]?.message?.content ?? "";
      if (text.trim()) {
        console.log(chalk.green(`✓ Vision OCR extracted ${text.length} chars`));
        return text;
      }
    } catch (err) {
      console.warn(chalk.yellow(`⚠ Vision OCR [${model}] failed: ${(err as Error).message}`));
    }
  }
  throw new Error("All vision models failed to extract text from image");
}

async function evaluateAnswers(
  paper: GeneratedPaper,
  studentText: string,
): Promise<QuestionEvaluation[]> {
  const answerKey = buildAnswerKey(paper);
  const prompt = buildEvalPrompt(answerKey, studentText);

  const completion = await openai.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      {
        role: "system",
        content: "You are an expert school examiner. Respond with valid JSON only.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 8192,
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  if (!raw.trim()) throw new Error("Evaluator model returned empty response");

  const json = extractJson(raw);
  return JSON.parse(json) as QuestionEvaluation[];
}

export async function evaluateAnswerSheet(
  assignmentId: string,
  studentName: string,
  paper: GeneratedPaper,
  fileBuffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<Evaluation> {
  console.log(chalk.blue(`[evaluator] Evaluating "${studentName}" for assignment ${assignmentId}`));

  let studentText: string;

  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf" || originalName.endsWith(".pdf");
  const isHtml = mimeType === "text/html" || originalName.endsWith(".html") || originalName.endsWith(".htm");

  if (isImage) {
    const base64 = fileBuffer.toString("base64");
    studentText = await extractTextFromImage(base64, mimeType);
  } else if (isPdf) {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(fileBuffer);
    studentText = result.text.trim();
    console.log(chalk.green(`✓ PDF extracted ${studentText.length} chars`));
  } else {
    const raw = fileBuffer.toString("utf-8").trim();
    if (isHtml || raw.trimStart().startsWith("<")) {
      studentText = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    } else {
      studentText = raw;
    }
    console.log(chalk.green(`✓ Text extracted ${studentText.length} chars`));
  }

  if (!studentText || studentText.length < 10) {
    throw new Error("Could not extract readable text from the uploaded answer sheet.");
  }

  const questions = await evaluateAnswers(paper, studentText);

  const totalMarksAwarded = questions.reduce((s, q) => s + q.marksAwarded, 0);
  const totalMaxMarks = questions.reduce((s, q) => s + q.maxMarks, 0);
  const percentage = totalMaxMarks > 0 ? Math.round((totalMarksAwarded / totalMaxMarks) * 100) : 0;

  const evaluation: Evaluation = {
    id: crypto.randomUUID(),
    assignmentId,
    studentName,
    totalMarksAwarded,
    totalMaxMarks,
    percentage,
    grade: gradeFromPercentage(percentage),
    questions,
    createdAt: new Date().toISOString(),
  };

  console.log(chalk.green(`✓ Evaluation done — ${totalMarksAwarded}/${totalMaxMarks} (${percentage}%) ${evaluation.grade}`));
  return evaluation;
}
