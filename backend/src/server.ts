import crypto from "node:crypto";
import http from "node:http";

import cors from "cors";
import express from "express";
import helmet from "helmet";
import multer from "multer";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
import rateLimit from "express-rate-limit";
import { Server as SocketServer } from "socket.io";

import { cacheAssignments, clearAssignmentCache, connectRedis, readCachedAssignments } from "./cache";
import { config } from "./config";
import { connectMongo, deleteAssignment, getAssignment, listAssignments, listAssignmentsPaginated, saveAssignment } from "./repository";
import { enqueueGeneration, initializeQueue } from "./queue";
import { streamToolkitResponse, type ToolInput } from "./toolkit";
import { CreateAssignmentInput, type Assignment } from "./types";
import { createAssignmentSchema } from "./validation";

// ── App setup ───────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, { cors: { origin: "*" } });

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({ origin: "*", methods: ["GET", "POST", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));

// ── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));

// ── Rate limiters ────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "AI generation rate limit exceeded. Wait a moment and try again." },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: "Upload rate limit exceeded." },
});

// ── File upload (memory storage, 10MB max) ───────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "text/plain", "text/csv"];
    const byExt = /\.(pdf|txt|csv)$/i.test(file.originalname);
    cb(null, allowed.includes(file.mimetype) || byExt);
  },
});

// ── Shared helpers ───────────────────────────────────────────────────────────
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
    extractedText: input.extractedText,
  };
}

async function publishAssignmentUpdate(assignment: Assignment) {
  await clearAssignmentCache();
  io.emit("assignment:update", { assignment });
}

// ── Main API router ──────────────────────────────────────────────────────────
const router = express.Router();

// Health
router.get("/health", (_req, res) => { res.json({ ok: true, version: "v1" }); });

// ─────────────── Assignments ─────────────────────────────────────────────────

// GET /assignments  (supports ?page=&limit= on v1)
router.get("/assignments", async (request, response) => {
  const page = Math.max(1, parseInt(request.query.page as string) || 0);
  const limitParam = parseInt(request.query.limit as string) || 0;

  // No pagination params → return all (cached, backward compat)
  if (!page && !limitParam) {
    const cached = await readCachedAssignments();
    if (cached) {
      response.json({ assignments: cached });
      return;
    }
    const assignments = await listAssignments();
    await cacheAssignments(assignments);
    response.json({ assignments });
    return;
  }

  // Paginated
  const limit = Math.min(50, Math.max(1, limitParam || 20));
  const actualPage = Math.max(1, page || 1);
  const { assignments, total } = await listAssignmentsPaginated(actualPage, limit);
  response.json({
    assignments,
    pagination: {
      page: actualPage,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// POST /assignments
router.post("/assignments", async (request, response) => {
  const parsed = createAssignmentSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid assignment payload.", errors: parsed.error.flatten() });
    return;
  }
  const assignment = buildAssignment(parsed.data);
  await saveAssignment(assignment);
  await publishAssignmentUpdate(assignment);
  response.status(201).json({ assignment });
});

// GET /assignments/:id
router.get("/assignments/:assignmentId", async (request, response) => {
  const assignment = await getAssignment(request.params.assignmentId);
  if (!assignment) {
    response.status(404).json({ message: "Assignment not found." });
    return;
  }
  response.json({ assignment });
});

// DELETE /assignments/:id
router.delete("/assignments/:assignmentId", async (request, response) => {
  const assignment = await getAssignment(request.params.assignmentId);
  if (!assignment) {
    response.status(404).json({ message: "Assignment not found." });
    return;
  }
  await deleteAssignment(request.params.assignmentId);
  await clearAssignmentCache();
  io.emit("assignment:deleted", { assignmentId: request.params.assignmentId });
  response.json({ success: true });
});

// POST /assignments/:id/upload  — file → extract text → store
router.post(
  "/assignments/:assignmentId/upload",
  uploadLimiter,
  upload.single("file"),
  async (request, response) => {
    const assignmentId = Array.isArray(request.params.assignmentId)
      ? request.params.assignmentId[0]
      : request.params.assignmentId;
    const assignment = await getAssignment(assignmentId);
    if (!assignment) {
      response.status(404).json({ message: "Assignment not found." });
      return;
    }

    const file = request.file;
    if (!file) {
      response.status(400).json({ message: "No file received." });
      return;
    }

    let extractedText = "";
    try {
      if (file.mimetype === "application/pdf" || file.originalname.endsWith(".pdf")) {
        const result = await pdfParse(file.buffer);
        extractedText = result.text.trim();
      } else {
        // Plain text / CSV
        extractedText = file.buffer.toString("utf-8").trim();
      }
    } catch {
      response.status(422).json({ message: "Could not extract text from the uploaded file." });
      return;
    }

    const updated: Assignment = {
      ...assignment,
      fileName: file.originalname,
      extractedText: extractedText.slice(0, 12000), // cap at 12k chars
    };
    await saveAssignment(updated);
    await publishAssignmentUpdate(updated);
    response.json({ assignment: updated, extractedChars: extractedText.length });
  },
);

// POST /assignments/:id/generate
router.post("/assignments/:assignmentId/generate", async (request, response) => {
  const assignment = await enqueueGeneration(request.params.assignmentId);
  if (!assignment) {
    response.status(404).json({ message: "Assignment not found." });
    return;
  }
  await publishAssignmentUpdate(assignment);
  response.json({ assignment });
});

// POST /assignments/:id/regenerate
router.post("/assignments/:assignmentId/regenerate", async (request, response) => {
  const existing = await getAssignment(request.params.assignmentId);
  if (!existing) {
    response.status(404).json({ message: "Assignment not found." });
    return;
  }
  const reset: Assignment = { ...existing, status: "draft", generatedPaper: undefined };
  await saveAssignment(reset);
  const queued = await enqueueGeneration(reset.id);
  if (!queued) {
    response.status(500).json({ message: "Failed to queue regeneration." });
    return;
  }
  await publishAssignmentUpdate(queued);
  response.json({ assignment: queued });
});

// ─────────────── Toolkit (streaming NVIDIA LLM) ───────────────────────────────
router.post("/toolkit/generate", aiLimiter, async (request, response) => {
  if (!config.nvidiaApiKey) {
    response.status(500).json({ message: "NVIDIA_API_KEY not configured on server." });
    return;
  }
  const input = request.body as ToolInput;
  if (!input.tool) {
    response.status(400).json({ message: "Missing 'tool' field in request body." });
    return;
  }

  response.setHeader("Content-Type", "text/event-stream");
  response.setHeader("Cache-Control", "no-cache");
  response.setHeader("Connection", "keep-alive");
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.flushHeaders();

  try {
    await streamToolkitResponse(input, (token) => {
      response.write(`data: ${JSON.stringify({ token })}\n\n`);
    });
    response.write("data: [DONE]\n\n");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    response.write(`data: ${JSON.stringify({ error: message })}\n\n`);
  } finally {
    response.end();
  }
});

// ── Mount router at /api  AND  /api/v1 ──────────────────────────────────────
app.use("/api", generalLimiter, router);
app.use("/api/v1", generalLimiter, router);

// ── WebSocket ────────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  socket.emit("connected", { ok: true });
});

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  await connectMongo();
  await connectRedis();
  await initializeQueue({ onAssignmentUpdate: publishAssignmentUpdate });

  server.listen(config.port, () => {
    console.log(`Backend listening on http://localhost:${config.port}`);
    console.log(`API available at /api and /api/v1`);
  });
}

void start();
