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
    ? `\n\n=== UPLOADED SOURCE DOCUMENT ===\n${assignment.extractedText!.slice(0, 8000)}\n=== END OF SOURCE DOCUMENT ===`
    : "";

  const sourceRule = hasSource
    ? `\n\nMANDATORY RULE: Every single question must be drawn DIRECTLY from the SOURCE DOCUMENT above. Do NOT include any question about a topic, fact, concept, diagram, or example that does not appear in that document. Treat the document as the only allowed knowledge base.`
    : `\n\nBase questions on the ${assignment.board} curriculum for ${assignment.className} ${assignment.subject}.`;

  return `You are an expert ${assignment.board} teacher creating an examination paper.${fileSection}${sourceRule}

Exam details:
- School: ${assignment.schoolName}
- Board: ${assignment.board}
- Class: ${assignment.className}
- Subject: ${assignment.subject}
- Teacher notes: ${assignment.instructions}

Sections required (generate EXACTLY the number of questions specified):
${sectionSpecs}

Return ONLY a valid JSON object (no markdown, no code fences) with this exact shape:
{
  "greeting": string,
  "paperTitle": string,
  "schoolName": string,
  "subject": string,
  "className": string,
  "timeAllowed": string,
  "maximumMarks": number,
  "studentFields": string[],
  "sections": [{
    "id": string,
    "title": string,
    "instruction": string,
    "questions": [{
      "id": string,
      "text": string,
      "difficulty": "Easy" | "Moderate" | "Challenging",
      "marks": number,
      "answer": string
    }]
  }],
  "answerKey": [{ "id": string, "text": string }]
}`;
}

export async function generateQuestionPaper(assignment: Assignment): Promise<GeneratedPaper> {
  console.log(chalk.blue("Structuring sections, balancing difficulty, assigning marks, and formatting your paper."));
  
  if (!config.nvidiaApiKey) {
    console.warn("NVIDIA_API_KEY not set — using template generator");
    return buildTemplatePaper(assignment);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content:
            "You are an expert teacher who creates structured, curriculum-aligned question papers. Always respond with valid JSON only — no markdown, no explanation.",
        },
        {
          role: "user",
          content: buildPrompt(assignment),
        },
      ],
      temperature: 0.7,
      top_p: 1,
      max_tokens: 4096,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    // Strip markdown code fences if the model wraps output
    const json = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

    const parsed = JSON.parse(json) as GeneratedPaper;
    return parsed;
  } catch (err) {
    console.error("NVIDIA generation failed, falling back to template:", err);
    return buildTemplatePaper(assignment);
  }
}
