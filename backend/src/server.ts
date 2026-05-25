import crypto from "node:crypto";
import http from "node:http";

import cors from "cors";
import express, { type Request, type Response } from "express";
import helmet from "helmet";
import multer from "multer";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
import rateLimit from "express-rate-limit";
import { Server as SocketServer } from "socket.io";

import { cacheAssignments, clearAssignmentCache, connectRedis, readCachedAssignments } from "./cache";
import { config } from "./config";
import {
  connectMongo,
  deleteAssignment,
  deleteGroup,
  deleteLibraryDoc,
  getAppStats,
  getAssignment,
  listAssignments,
  listAssignmentsPaginated,
  listGroups,
  listLibraryDocs,
  saveAssignment,
  saveGroup,
  saveLibraryDoc,
  seedAssignmentsIfEmpty,
  seedGroupsIfEmpty,
  seedLibraryDocsIfEmpty,
} from "./repository";
import { enqueueGeneration, initializeQueue } from "./queue";
import { streamToolkitResponse, type ToolInput } from "./toolkit";
import { CreateAssignmentInput, Group, LibraryDoc, type Assignment } from "./types";
import { createAssignmentSchema } from "./validation";

// ── App setup ────────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, { cors: { origin: "*" } });

// ── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: "*", methods: ["GET", "POST", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json({ limit: "2mb" }));

// ── Rate limiters ─────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
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

// ── File upload ───────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "text/plain", "text/csv"];
    const byExt = /\.(pdf|txt|csv)$/i.test(file.originalname);
    cb(null, allowed.includes(file.mimetype) || byExt);
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function totalize(questionTypes: Assignment["questionTypes"]) {
  return questionTypes.reduce(
    (acc, item) => { acc.totalQuestions += item.count; acc.totalMarks += item.count * item.marks; return acc; },
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

// ── Helpers ───────────────────────────────────────────────────────────────────
// Express 5 types `req.params` values as `string | string[]`
function p(val: string | string[]): string {
  return Array.isArray(val) ? val[0] : val;
}

// ── Flat route registration at /api/v1/* ──────────────────────────────────────
// (No sub-router — registering directly on app avoids any Express 5 path-strip issues)

const V1 = "/api/v1";

// Health
app.get(`${V1}/health`, (_req, res) => { res.json({ ok: true, version: "v1" }); });

// Stats
app.get(`${V1}/stats`, generalLimiter, async (_req: Request, res: Response) => {
  const stats = await getAppStats();
  res.json(stats);
});

// ─── Assignments ──────────────────────────────────────────────────────────────

app.get(`${V1}/assignments`, generalLimiter, async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 0;
  const limitParam = parseInt(req.query.limit as string) || 0;

  if (!page && !limitParam) {
    const cached = await readCachedAssignments();
    if (cached) { res.json({ assignments: cached }); return; }
    const assignments = await listAssignments();
    await cacheAssignments(assignments);
    res.json({ assignments });
    return;
  }

  const limit = Math.min(50, Math.max(1, limitParam || 20));
  const actualPage = Math.max(1, page || 1);
  const { assignments, total } = await listAssignmentsPaginated(actualPage, limit);
  res.json({ assignments, pagination: { page: actualPage, limit, total, pages: Math.ceil(total / limit) } });
});

app.post(`${V1}/assignments`, generalLimiter, async (req: Request, res: Response) => {
  const parsed = createAssignmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid assignment payload.", errors: parsed.error.flatten() });
    return;
  }
  const assignment = buildAssignment(parsed.data);
  await saveAssignment(assignment);
  await publishAssignmentUpdate(assignment);
  res.status(201).json({ assignment });
});

app.get(`${V1}/assignments/:assignmentId`, generalLimiter, async (req: Request, res: Response) => {
  const assignment = await getAssignment(p(req.params.assignmentId));
  if (!assignment) { res.status(404).json({ message: "Assignment not found." }); return; }
  res.json({ assignment });
});

app.delete(`${V1}/assignments/:assignmentId`, generalLimiter, async (req: Request, res: Response) => {
  const assignmentId = p(req.params.assignmentId);
  const assignment = await getAssignment(assignmentId);
  if (!assignment) { res.status(404).json({ message: "Assignment not found." }); return; }
  await deleteAssignment(assignmentId);
  await clearAssignmentCache();
  io.emit("assignment:deleted", { assignmentId });
  res.json({ success: true });
});

app.post(
  `${V1}/assignments/:assignmentId/upload`,
  uploadLimiter,
  upload.single("file"),
  async (req: Request, res: Response) => {
    const assignmentId = p(req.params.assignmentId);
    const assignment = await getAssignment(assignmentId);
    if (!assignment) { res.status(404).json({ message: "Assignment not found." }); return; }

    const file = req.file;
    if (!file) { res.status(400).json({ message: "No file received." }); return; }

    let extractedText = "";
    try {
      if (file.mimetype === "application/pdf" || file.originalname.endsWith(".pdf")) {
        const result = await pdfParse(file.buffer);
        extractedText = result.text.trim();
      } else {
        extractedText = file.buffer.toString("utf-8").trim();
      }
    } catch {
      res.status(422).json({ message: "Could not extract text from the uploaded file." });
      return;
    }

    const updated: Assignment = { ...assignment, fileName: file.originalname, extractedText: extractedText.slice(0, 12000) };
    await saveAssignment(updated);
    await publishAssignmentUpdate(updated);
    res.json({ assignment: updated, extractedChars: extractedText.length });
  },
);

app.post(`${V1}/assignments/:assignmentId/generate`, generalLimiter, async (req: Request, res: Response) => {
  const assignment = await enqueueGeneration(p(req.params.assignmentId));
  if (!assignment) { res.status(404).json({ message: "Assignment not found." }); return; }
  await publishAssignmentUpdate(assignment);
  res.json({ assignment });
});

app.post(`${V1}/assignments/:assignmentId/regenerate`, generalLimiter, async (req: Request, res: Response) => {
  const existing = await getAssignment(p(req.params.assignmentId));
  if (!existing) { res.status(404).json({ message: "Assignment not found." }); return; }
  const reset: Assignment = { ...existing, status: "draft", generatedPaper: undefined };
  await saveAssignment(reset);
  const queued = await enqueueGeneration(reset.id);
  if (!queued) { res.status(500).json({ message: "Failed to queue regeneration." }); return; }
  await publishAssignmentUpdate(queued);
  res.json({ assignment: queued });
});

// ─── Groups ───────────────────────────────────────────────────────────────────

app.get(`${V1}/groups`, generalLimiter, async (_req: Request, res: Response) => {
  const groups = await listGroups();
  res.json({ groups });
});

app.post(`${V1}/groups`, generalLimiter, async (req: Request, res: Response) => {
  const { subject, className, board, students, iconName, color, bg } = req.body as Partial<Group>;
  if (!subject || !className || !board) {
    res.status(400).json({ message: "subject, className, and board are required." });
    return;
  }
  const group: Group = {
    id: crypto.randomUUID(),
    subject,
    className,
    board,
    students: students ?? 0,
    assignments: 0,
    color: color ?? "#6366f1",
    bg: bg ?? "#eef2ff",
    iconName: iconName ?? "BookOpen",
    createdAt: new Date().toISOString(),
  };
  await saveGroup(group);
  res.status(201).json({ group });
});

app.delete(`${V1}/groups/:groupId`, generalLimiter, async (req: Request, res: Response) => {
  await deleteGroup(p(req.params.groupId));
  res.json({ success: true });
});

// ─── Library ──────────────────────────────────────────────────────────────────

app.get(`${V1}/library`, generalLimiter, async (_req: Request, res: Response) => {
  const docs = await listLibraryDocs();
  res.json({ docs });
});

app.post(`${V1}/library`, generalLimiter, async (req: Request, res: Response) => {
  const { title, type, subject, className, date, pages, starred } = req.body as Partial<LibraryDoc>;
  if (!title || !type || !subject || !className) {
    res.status(400).json({ message: "title, type, subject, and className are required." });
    return;
  }
  const doc: LibraryDoc = {
    id: crypto.randomUUID(),
    title,
    type,
    subject,
    className,
    date: date ?? new Date().toISOString().slice(0, 10),
    pages: pages ?? 1,
    starred: starred ?? false,
    createdAt: new Date().toISOString(),
  };
  await saveLibraryDoc(doc);
  res.status(201).json({ doc });
});

app.delete(`${V1}/library/:docId`, generalLimiter, async (req: Request, res: Response) => {
  await deleteLibraryDoc(p(req.params.docId));
  res.json({ success: true });
});

// ─── Toolkit (streaming NVIDIA LLM) ──────────────────────────────────────────

app.post(`${V1}/toolkit/generate`, aiLimiter, async (req: Request, res: Response) => {
  if (!config.nvidiaApiKey) {
    res.status(500).json({ message: "NVIDIA_API_KEY not configured on server." });
    return;
  }
  const input = req.body as ToolInput;
  if (!input.tool) {
    res.status(400).json({ message: "Missing 'tool' field in request body." });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  try {
    await streamToolkitResponse(input, (token) => {
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    });
    res.write("data: [DONE]\n\n");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
  } finally {
    res.end();
  }
});

// ── WebSocket ─────────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  socket.emit("connected", { ok: true });
});

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  await connectMongo();
  await connectRedis();
  await initializeQueue({ onAssignmentUpdate: publishAssignmentUpdate });
  await seedAssignmentsIfEmpty();
  await seedGroupsIfEmpty();
  await seedLibraryDocsIfEmpty();

  server.listen(config.port, () => {
    console.log(`Backend listening on http://localhost:${config.port}`);
    console.log(`Routes available at /api/v1/*`);
  });
}

void start();
