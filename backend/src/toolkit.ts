import OpenAI from "openai";

import { config } from "./config";

const openai = new OpenAI({
  apiKey: config.nvidiaApiKey,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

const MODEL = "openai/gpt-oss-120b";

export type ToolInput = {
  tool: string;
  subject?: string;
  className?: string;
  topic?: string;
  duration?: string;
  board?: string;
  count?: string;
  difficulty?: string;
  studentName?: string;
  performance?: string;
  chapter?: string;
};

function buildSystemPrompt(): string {
  return (
    "You are an expert teacher and curriculum designer. " +
    "Provide clear, structured, curriculum-aligned content. " +
    "Use markdown formatting with headers (##), bullet points (-), and numbered lists where appropriate. " +
    "Be thorough, practical, and specific to the board and class level provided."
  );
}

function buildUserPrompt(input: ToolInput): string {
  const board = input.board ?? "CBSE";
  const cls = input.className ?? "";
  const subject = input.subject ?? "";

  switch (input.tool) {
    case "lesson-plan":
      return `Create a detailed lesson plan for:
- Subject: ${subject}
- Class: ${cls}
- Topic: ${input.topic ?? ""}
- Duration: ${input.duration ?? "45 minutes"}
- Board: ${board}

Structure:
## Learning Objectives
## Materials Required
## Introduction (5 min)
## Main Activity (${input.duration ?? "30 min"})
## Assessment / Wrap-up (5 min)
## Homework`;

    case "quiz":
      return `Create a ${input.difficulty ?? "mixed difficulty"} quiz:
- Subject: ${subject}
- Class: ${cls}
- Topic: ${input.topic ?? ""}
- Total questions: ${input.count ?? "10"}
- Board: ${board}

Include MCQs (with 4 options), short-answer questions, and an Answer Key section at the end.
Number every question clearly.`;

    case "feedback":
      return `Write personalised academic feedback for a student:
- Name: ${input.studentName ?? "Student"}
- Subject: ${subject}
- Class: ${cls}
- Performance notes: ${input.performance ?? "Average performance"}

Write 3–4 paragraphs covering: observed strengths, specific improvement areas, actionable next steps, and an encouraging closing.
Use a warm, professional teacher tone.`;

    case "study-guide":
      return `Create a comprehensive study guide for:
- Subject: ${subject}
- Class: ${cls}
- Chapter / Topic: ${input.chapter ?? input.topic ?? ""}
- Board: ${board}

Include:
## Key Concepts Summary
## Important Formulas / Dates / Terms
## Common Exam Questions & Model Answers
## Quick Revision Tips
## Memory Aids / Mnemonics`;

    case "rubric":
      return `Build a detailed assessment rubric for:
- Subject: ${subject}
- Class: ${cls}
- Assignment type: ${input.topic ?? ""}
- Board: ${board}

Create a 4-level rubric table (Excellent / Good / Satisfactory / Needs Improvement).
Cover at least 4 distinct criteria with clear descriptors for each level.`;

    case "explainer":
      return `Explain this concept clearly for students:
- Subject: ${subject}
- Class: ${cls}
- Concept: ${input.topic ?? ""}
- Board: ${board}

Use:
## Simple Explanation
## Real-World Example / Analogy
## Step-by-Step Breakdown (if applicable)
## 3 Comprehension Check Questions (with answers)`;

    default:
      return `Generate helpful educational content for subject "${subject}", class "${cls}", topic "${input.topic ?? ""}". Board: ${board}.`;
  }
}

export async function streamToolkitResponse(
  input: ToolInput,
  onChunk: (text: string) => void,
): Promise<void> {
  const stream = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(input) },
    ],
    temperature: 0.7,
    top_p: 1,
    max_tokens: 2048,
    stream: true,
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content ?? "";
    if (token) onChunk(token);
  }
}
