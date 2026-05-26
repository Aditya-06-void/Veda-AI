import OpenAI from "openai";
import chalk from "chalk";

import { config } from "./config";
import type {
  Assignment,
  GeneratedPaper,
  GeneratedQuestion,
  GeneratedSection,
  QuestionDifficulty,
} from "./types";

const openai = new OpenAI({
  apiKey: config.nvidiaApiKey,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

function difficultyFor(index: number): QuestionDifficulty {
  if (index % 3 === 0) return "Easy";
  if (index % 3 === 1) return "Moderate";
  return "Challenging";
}

function buildTemplatePaper(assignment: Assignment): GeneratedPaper {
  let runningQ = 1;
  const sections: GeneratedSection[] = assignment.questionTypes.map((item, idx) => {
    const questions: GeneratedQuestion[] = Array.from({ length: item.count }, (_, offset) => {
      const difficulty = difficultyFor(runningQ + offset);
      return {
        id: `q-${runningQ + offset}`,
        text: `Question ${runningQ + offset}: Explain a key concept from ${assignment.subject} for ${assignment.className}. (${difficulty})`,
        difficulty,
        marks: item.marks,
        answer: `Answer ${runningQ + offset}: A concise explanation for the concept as per ${assignment.board} curriculum.`,
      };
    });
    runningQ += item.count;
    return {
      id: `section-${idx + 1}`,
      title: item.type,
      instruction:
        idx === 0
          ? `Attempt all questions. Each question carries ${item.marks} mark(s).`
          : `Answer all ${item.count} question(s). Write clear steps where needed.`,
      questions,
    };
  });

  return {
    greeting: `Certainly! Here is a customized Question Paper for your ${assignment.board} ${assignment.className} ${assignment.subject} class.`,
    paperTitle: `${assignment.subject} Assessment`,
    schoolName: assignment.schoolName,
    subject: assignment.subject,
    className: assignment.className,
    timeAllowed: "45 minutes",
    maximumMarks: assignment.totalMarks,
    studentFields: ["Name", "Roll Number", "Section"],
    sections,
    answerKey: sections.flatMap((s) =>
      s.questions.map((q) => ({ id: q.id, text: q.answer })),
    ),
  };
}

function buildPrompt(assignment: Assignment): string {
  const sectionSpecs = assignment.questionTypes
    .map((qt, i) => `Section ${String.fromCharCode(65 + i)}: ${qt.type} — ${qt.count} question(s) × ${qt.marks} mark(s) each`)
    .join("\n");

  const hasSource = Boolean(assignment.extractedText);

  const fileSection = hasSource
    ? `\n\n=== SOURCE DOCUMENT (your ONLY allowed knowledge base) ===\n${assignment.extractedText!.slice(0, 8000)}\n=== END OF SOURCE DOCUMENT ===`
    : "";

  const sourceRule = hasSource
    ? `\n\nSTRICT RULE — SOURCE DOCUMENT ONLY:
- You MUST generate ALL questions exclusively from the SOURCE DOCUMENT above.
- Do NOT use any outside knowledge, textbook content, or general CBSE curriculum.
- Every fact, concept, formula, example, and term in every question and answer MUST appear verbatim or be directly derivable from the SOURCE DOCUMENT.
- If a question cannot be formed from the source document, skip that topic and pick another one that IS in the document.
- Violating this rule by including off-topic questions is NOT acceptable.`
    : `\n\nBase questions on the ${assignment.board} curriculum for ${assignment.className} ${assignment.subject}.`;

  const totalQuestions = assignment.questionTypes.reduce((s, qt) => s + qt.count, 0);

  return `You are an expert ${assignment.board} teacher. Create an exam paper with exactly ${totalQuestions} questions.${fileSection}${sourceRule}

Exam: ${assignment.schoolName} | ${assignment.board} | ${assignment.className} | ${assignment.subject}
Teacher notes: ${assignment.instructions}

Sections (generate EXACTLY the counts below):
${sectionSpecs}

IMPORTANT: Keep each "answer" field to 1-2 sentences maximum to stay within token limits.

Return ONLY a valid JSON object — no markdown, no code fences, no explanation. Use this exact shape:
{"greeting":string,"paperTitle":string,"schoolName":string,"subject":string,"className":string,"timeAllowed":string,"maximumMarks":number,"studentFields":["Name","Roll Number","Section"],"sections":[{"id":string,"title":string,"instruction":string,"questions":[{"id":string,"text":string,"difficulty":"Easy"|"Moderate"|"Challenging","marks":number,"answer":string}]}],"answerKey":[{"id":string,"text":string}]}`;
}

// Models tried in order — first success wins.
const MODEL_CHAIN = [
  "openai/gpt-oss-120b",
  "meta/llama-3.3-70b-instruct",
  "google/gemma-4-31b-it",
] as const;

function extractJson(raw: string): string {
  // Strip markdown fences
  let s = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  // Find the outermost JSON object in case the model added preamble
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) s = s.slice(start, end + 1);
  return s;
}

async function tryModel(model: string, assignment: Assignment): Promise<GeneratedPaper> {
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: "You are an expert teacher. Respond with valid JSON only — no markdown, no explanation, no preamble.",
      },
      { role: "user", content: buildPrompt(assignment) },
    ],
    temperature: 0.7,
    top_p: 1,
    max_tokens: 16384,
  });

  const choice = completion.choices[0];

  if (choice?.finish_reason === "length") {
    throw new Error(`Model ${model} truncated the response (finish_reason=length)`);
  }

  const raw = choice?.message?.content ?? "";
  if (!raw.trim()) throw new Error(`Model ${model} returned empty response`);

  const json = extractJson(raw);
  const parsed = JSON.parse(json) as GeneratedPaper;

  if (!parsed.sections?.length || !parsed.answerKey?.length) {
    throw new Error(`Model ${model} returned incomplete paper structure`);
  }

  return parsed;
}

export async function generateQuestionPaper(assignment: Assignment): Promise<GeneratedPaper> {
  console.log(chalk.blue("Structuring sections, balancing difficulty, assigning marks, and formatting your paper."));

  if (!config.nvidiaApiKey) {
    console.warn(chalk.yellow("NVIDIA_API_KEY not set — using template generator"));
    return buildTemplatePaper(assignment);
  }

  for (const model of MODEL_CHAIN) {
    try {
      console.log(chalk.cyan(`→ Trying model: ${model}`));
      const paper = await tryModel(model, assignment);
      console.log(chalk.green(`✓ [${model}] Generated ${paper.sections.length} sections, ${paper.answerKey.length} questions`));
      return paper;
    } catch (err) {
      console.warn(chalk.yellow(`⚠ [${model}] failed: ${(err as Error).message}`));
    }
  }

  console.error(chalk.red("All models failed — using template fallback"));
  return buildTemplatePaper(assignment);
}
