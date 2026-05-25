import { NextRequest } from "next/server";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY ?? "";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const MODEL = "openai/gpt-oss-120b";

type ToolInput = {
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

function buildPrompt(input: ToolInput): string {
  switch (input.tool) {
    case "lesson-plan":
      return `Create a detailed lesson plan for:
Subject: ${input.subject ?? ""}
Class: ${input.className ?? ""}
Topic: ${input.topic ?? ""}
Duration: ${input.duration ?? "45 minutes"}
Board: ${input.board ?? "CBSE"}

Include: Learning objectives, materials needed, introduction (5 min), main activities with timing, assessment, and homework.
Format with clear headings and bullet points.`;

    case "quiz":
      return `Create a ${input.difficulty ?? "mixed difficulty"} quiz on:
Subject: ${input.subject ?? ""}
Class: ${input.className ?? ""}
Topic: ${input.topic ?? ""}
Number of questions: ${input.count ?? "10"}
Board: ${input.board ?? "CBSE"}

Include MCQs and short answer questions. Provide answer key at the end.
Format each question clearly with question number.`;

    case "feedback":
      return `Write personalised academic feedback for a student:
Student: ${input.studentName ?? "Student"}
Subject: ${input.subject ?? ""}
Class: ${input.className ?? ""}
Performance summary: ${input.performance ?? ""}

Write 3-4 paragraphs covering: strengths observed, areas to improve, specific action steps, and an encouraging closing.
Use a warm, professional teacher's tone.`;

    case "study-guide":
      return `Create a comprehensive study guide for:
Subject: ${input.subject ?? ""}
Class: ${input.className ?? ""}
Chapter/Topic: ${input.chapter ?? input.topic ?? ""}
Board: ${input.board ?? "CBSE"}

Include: Key concepts summary, important formulas/dates/terms, common exam questions with answers, quick revision tips, and memory aids.`;

    case "rubric":
      return `Build a detailed assessment rubric for:
Subject: ${input.subject ?? ""}
Class: ${input.className ?? ""}
Assignment type: ${input.topic ?? ""}
Board: ${input.board ?? "CBSE"}

Create a 4-level rubric (Excellent/Good/Satisfactory/Needs Improvement) with clear descriptors for each criterion.
Format as a table-like structure.`;

    case "explainer":
      return `Explain this concept clearly for students:
Subject: ${input.subject ?? ""}
Class: ${input.className ?? ""}
Concept: ${input.topic ?? ""}
Board: ${input.board ?? "CBSE"}

Write a clear explanation using: simple language appropriate for the grade, real-world examples or analogies, step-by-step breakdown where applicable, and 3 follow-up questions for comprehension check.`;

    default:
      return `Generate helpful educational content for ${input.subject ?? "the subject"}, Class ${input.className ?? ""}, on the topic: ${input.topic ?? ""}.`;
  }
}

export async function POST(request: NextRequest) {
  if (!NVIDIA_API_KEY) {
    return new Response(JSON.stringify({ error: "NVIDIA_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const input = (await request.json()) as ToolInput;
  const prompt = buildPrompt(input);

  const upstream = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert teacher and educator. Provide clear, structured, curriculum-aligned content. Use markdown formatting with headers and bullet points.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      top_p: 1,
      max_tokens: 2048,
      stream: true,
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    return new Response(JSON.stringify({ error: err }), {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
