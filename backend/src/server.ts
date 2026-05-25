import crypto from "node:crypto";
import http from "node:http";

import cors from "cors";
import express from "express";
import { Server as SocketServer } from "socket.io";

import { cacheAssignments, clearAssignmentCache, connectRedis, readCachedAssignments } from "./cache";
import { config } from "./config";
import { connectMongo, getAssignment, listAssignments, saveAssignment } from "./repository";
import { enqueueGeneration, initializeQueue } from "./queue";
import { CreateAssignmentInput, type Assignment } from "./types";
import { createAssignmentSchema } from "./validation";

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json({ limit: "2mb" }));

function totalize(questionTypes: Assignment["questionTypes"]) {
  return questionTypes.reduce(
    (acc, item) => {
      acc.totalQuestions += item.count;
      acc.totalMarks += item.count * item.marks;
      return acc;
    },
    { totalQuestions: 0, totalMarks: 0 },
  );
}

function buildAssignment(input: CreateAssignmentInput): Assignment {
  const totals = totalize(input.questionTypes);

  return {
    id: crypto.randomUUID(),
    title: `${input.subject} Assignment`,
    schoolName: input.schoolName,
    board: input.board,
    className: input.className,
    subject: input.subject,
    dueDate: input.dueDate,
    instructions: input.instructions,
    questionTypes: input.questionTypes,
    totalQuestions: totals.totalQuestions,
    totalMarks: totals.totalMarks,
    createdAt: new Date().toISOString(),
    status: "draft",
    fileName: input.fileName,
  };
}

async function publishAssignmentUpdate(assignment: Assignment) {
  await clearAssignmentCache();
  io.emit("assignment:update", { assignment });
}

app.get("/health", async (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/assignments", async (_request, response) => {
  const cached = await readCachedAssignments();
  if (cached) {
    response.json({ assignments: cached });
    return;
  }

  const assignments = await listAssignments();
  await cacheAssignments(assignments);
  response.json({ assignments });
});

app.post("/api/assignments", async (request, response) => {
  const parsed = createAssignmentSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid assignment payload." });
    return;
  }

  const assignment = buildAssignment(parsed.data);
  await saveAssignment(assignment);
  await publishAssignmentUpdate(assignment);
  response.status(201).json({ assignment });
});

app.get("/api/assignments/:assignmentId", async (request, response) => {
  const assignment = await getAssignment(request.params.assignmentId);
  if (!assignment) {
    response.status(404).json({ message: "Assignment not found." });
    return;
  }

  response.json({ assignment });
});

app.post("/api/assignments/:assignmentId/generate", async (request, response) => {
  const assignment = await enqueueGeneration(request.params.assignmentId);
  if (!assignment) {
    response.status(404).json({ message: "Assignment not found." });
    return;
  }

  await publishAssignmentUpdate(assignment);
  response.json({ assignment });
});

app.post("/api/assignments/:assignmentId/regenerate", async (request, response) => {
  const existing = await getAssignment(request.params.assignmentId);
  if (!existing) {
    response.status(404).json({ message: "Assignment not found." });
    return;
  }

  const reset: Assignment = {
    ...existing,
    status: "draft",
    generatedPaper: undefined,
  };

  await saveAssignment(reset);
  const queued = await enqueueGeneration(reset.id);
  if (!queued) {
    response.status(500).json({ message: "Failed to queue regeneration." });
    return;
  }

  await publishAssignmentUpdate(queued);
  response.json({ assignment: queued });
});

io.on("connection", (socket) => {
  socket.emit("connected", { ok: true });
});

async function start() {
  await connectMongo();
  await connectRedis();
  await initializeQueue({
    onAssignmentUpdate: publishAssignmentUpdate,
  });

  server.listen(config.port, () => {
    console.log(`Backend listening on http://localhost:${config.port}`);
  });
}

void start();
