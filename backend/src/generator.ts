import { GeneratedPaper, GeneratedQuestion, GeneratedSection, QuestionDifficulty } from "./types";

import type { Assignment } from "./types";

const promptHints: Record<string, string[]> = {
  "Multiple Choice Questions": [
    "Choose the correct answer for each concept",
    "Pick the best explanation for the concept",
  ],
  "Short Questions": [
    "Explain the concept in one or two complete sentences",
    "Write the key scientific reason behind the process",
  ],
  "Long Questions": [
    "Explain the concept with steps and examples",
    "Compare the process and justify your answer",
  ],
  "Diagram/Graph-Based Questions": [
    "Study the diagram carefully and answer what follows",
    "Use the labelled figure to explain the underlying concept",
  ],
  "Numerical Problems": [
    "Solve the problem and show the formula used",
    "Calculate the value and explain the unit",
  ],
  "Assertion & Reasoning": [
    "Evaluate the assertion and reason, then choose the correct relation",
    "State whether both statements are true and connected correctly",
  ],
  "Case Study Questions": [
    "Read the passage and answer the application-based question",
    "Use the classroom scenario to justify your scientific explanation",
  ],
};

function difficultyFor(index: number): QuestionDifficulty {
  if (index % 3 === 0) return "Easy";
  if (index % 3 === 1) return "Moderate";
  return "Challenging";
}

function questionText(
  assignment: Assignment,
  type: string,
  questionNumber: number,
  difficulty: QuestionDifficulty,
) {
  const stem = promptHints[type]?.[questionNumber % (promptHints[type]?.length ?? 1)] ??
    "Explain the concept clearly";

  return `${stem} for ${assignment.subject} in ${assignment.className}. Focus on ${assignment.instructions
    .replace(/\.$/, "")
    .slice(0, 70)} and keep the difficulty ${difficulty.toLowerCase()}.`;
}

function buildSections(assignment: Assignment) {
  const chunks: GeneratedSection[] = [];
  let runningQuestionNumber = 1;

  assignment.questionTypes.forEach((item, index) => {
    const questions: GeneratedQuestion[] = Array.from({ length: item.count }, (_, offset) => {
      const difficulty = difficultyFor(runningQuestionNumber + offset);
      return {
        id: `q-${runningQuestionNumber + offset}`,
        text: questionText(assignment, item.type, offset, difficulty),
        difficulty,
        marks: item.marks,
        answer: `${assignment.subject} answer ${runningQuestionNumber + offset}: A concise explanation for "${item.type}" that matches the requested difficulty and marking scheme.`,
      };
    });

    chunks.push({
      id: `section-${index + 1}`,
      title: item.type,
      instruction:
        index === 0
          ? `Attempt all questions. Each question carries ${item.marks} mark(s).`
          : `Answer all ${item.count} question(s). Write clear steps where needed.`,
      questions,
    });

    runningQuestionNumber += item.count;
  });

  return chunks;
}

export function buildStructuredPrompt(assignment: Assignment) {
  return [
    `Generate a structured question paper for ${assignment.board} ${assignment.className} ${assignment.subject}.`,
    `School: ${assignment.schoolName}`,
    `Due date: ${assignment.dueDate}`,
    `Question types: ${assignment.questionTypes
      .map((item) => `${item.type} x${item.count} (${item.marks} marks each)`)
      .join(", ")}`,
    `Instructions: ${assignment.instructions}`,
    "Return structured JSON with sections, questions, difficulty, marks, and answer key.",
  ].join("\n");
}

export async function generateQuestionPaper(assignment: Assignment): Promise<GeneratedPaper> {
  const sections = buildSections(assignment);

  return {
    greeting: `Certainly, Lakshya! Here are customized Question Paper for your ${assignment.board} ${assignment.className} ${assignment.subject} classes on the requested syllabus.`,
    paperTitle: `${assignment.subject} Assessment`,
    schoolName: assignment.schoolName,
    subject: assignment.subject,
    className: assignment.className,
    timeAllowed: "45 minutes",
    maximumMarks: assignment.totalMarks,
    studentFields: ["Name", "Roll Number", "Section"],
    sections,
    answerKey: sections.flatMap((section) =>
      section.questions.map((question) => ({
        id: question.id,
        text: question.answer,
      })),
    ),
  };
}
