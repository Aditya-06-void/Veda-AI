import crypto from "node:crypto";

import mongoose, { Schema } from "mongoose";

import { config } from "./config";
import { AppStats, Assignment, AssignmentStatus, GeneratedPaper, Group, LibraryDoc } from "./types";

// ─────────────────── Assignment ──────────────────────────────────────────────

type AssignmentDocument = mongoose.Document &
  Omit<Assignment, "id"> & {
    assignmentId: string;
  };

const questionTypeSchema = new Schema(
  { id: String, type: String, count: Number, marks: Number },
  { _id: false },
);

const questionSchema = new Schema(
  { id: String, text: String, difficulty: String, marks: Number, answer: String },
  { _id: false },
);

const sectionSchema = new Schema(
  { id: String, title: String, instruction: String, questions: [questionSchema] },
  { _id: false },
);

const answerKeySchema = new Schema({ id: String, text: String }, { _id: false });

const assignmentSchema = new Schema<AssignmentDocument>(
  {
    assignmentId: { type: String, unique: true, index: true },
    title: String,
    schoolName: String,
    board: String,
    className: String,
    subject: String,
    dueDate: String,
    instructions: String,
    questionTypes: [questionTypeSchema],
    totalQuestions: Number,
    totalMarks: Number,
    createdAt: String,
    status: String,
    fileName: String,
    extractedText: String,
    generatedPaper: {
      type: {
        greeting: String,
        paperTitle: String,
        schoolName: String,
        subject: String,
        className: String,
        timeAllowed: String,
        maximumMarks: Number,
        studentFields: [String],
        sections: [sectionSchema],
        answerKey: [answerKeySchema],
      },
      default: undefined,
    },
  },
  { versionKey: false },
);

const AssignmentModel =
  mongoose.models.Assignment ||
  mongoose.model<AssignmentDocument>("Assignment", assignmentSchema);

// ─────────────────── Group ───────────────────────────────────────────────────

type GroupDocument = mongoose.Document & Omit<Group, "id"> & { groupId: string };

const groupSchema = new Schema<GroupDocument>(
  {
    groupId: { type: String, unique: true, index: true },
    subject: String,
    className: String,
    students: Number,
    assignments: Number,
    color: String,
    bg: String,
    board: String,
    iconName: String,
    createdAt: String,
  },
  { versionKey: false },
);

const GroupModel =
  mongoose.models.Group || mongoose.model<GroupDocument>("Group", groupSchema);

// ─────────────────── LibraryDoc ──────────────────────────────────────────────

type LibraryDocDocument = mongoose.Document & Omit<LibraryDoc, "id"> & { docId: string };

const libraryDocSchema = new Schema<LibraryDocDocument>(
  {
    docId: { type: String, unique: true, index: true },
    title: String,
    type: String,
    subject: String,
    className: String,
    date: String,
    pages: Number,
    starred: Boolean,
    createdAt: String,
  },
  { versionKey: false },
);

const LibraryDocModel =
  mongoose.models.LibraryDoc ||
  mongoose.model<LibraryDocDocument>("LibraryDoc", libraryDocSchema);

// ─────────────────── Connection ──────────────────────────────────────────────

let mongoReady = false;

export async function connectMongo() {
  if (!config.mongoUrl) return false;
  if (mongoReady) return true;
  try {
    await mongoose.connect(config.mongoUrl);
    mongoReady = true;
    return true;
  } catch {
    mongoReady = false;
    return false;
  }
}

// ─────────────────── In-memory fallbacks ─────────────────────────────────────

const memoryAssignments = new Map<string, Assignment>();
const memoryGroups = new Map<string, Group>();
const memoryLibraryDocs = new Map<string, LibraryDoc>();

// ─────────────────── Mappers ─────────────────────────────────────────────────

function toAssignment(document: AssignmentDocument): Assignment {
  const generatedPaper =
    document.generatedPaper &&
    (document.generatedPaper as GeneratedPaper).sections?.length
      ? (document.generatedPaper as GeneratedPaper)
      : undefined;

  return {
    id: document.assignmentId,
    title: document.title,
    schoolName: document.schoolName,
    board: document.board,
    className: document.className,
    subject: document.subject,
    dueDate: document.dueDate,
    instructions: document.instructions,
    questionTypes: document.questionTypes,
    totalQuestions: document.totalQuestions,
    totalMarks: document.totalMarks,
    createdAt: document.createdAt,
    status: document.status as AssignmentStatus,
    fileName: document.fileName,
    extractedText: document.extractedText,
    generatedPaper,
  };
}

function toGroup(doc: GroupDocument): Group {
  return {
    id: doc.groupId,
    subject: doc.subject,
    className: doc.className,
    students: doc.students,
    assignments: doc.assignments,
    color: doc.color,
    bg: doc.bg,
    board: doc.board,
    iconName: doc.iconName,
    createdAt: doc.createdAt,
  };
}

function toLibraryDoc(doc: LibraryDocDocument): LibraryDoc {
  return {
    id: doc.docId,
    title: doc.title,
    type: doc.type as LibraryDoc["type"],
    subject: doc.subject,
    className: doc.className,
    date: doc.date,
    pages: doc.pages,
    starred: doc.starred,
    createdAt: doc.createdAt,
  };
}

// ─────────────────── Assignment CRUD ─────────────────────────────────────────

export async function listAssignments() {
  if (mongoReady) {
    const documents = await AssignmentModel.find().sort({ createdAt: -1 });
    return documents.map(toAssignment);
  }
  return [...memoryAssignments.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function listAssignmentsPaginated(page: number, limit: number) {
  const skip = (page - 1) * limit;
  if (mongoReady) {
    const [documents, total] = await Promise.all([
      AssignmentModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      AssignmentModel.countDocuments(),
    ]);
    return { assignments: documents.map(toAssignment), total };
  }
  const all = [...memoryAssignments.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return { assignments: all.slice(skip, skip + limit), total: all.length };
}

export async function saveAssignment(assignment: Assignment) {
  if (mongoReady) {
    await AssignmentModel.findOneAndUpdate(
      { assignmentId: assignment.id },
      { ...assignment, assignmentId: assignment.id },
      { upsert: true, new: true },
    );
  } else {
    memoryAssignments.set(assignment.id, assignment);
  }
  return assignment;
}

export async function getAssignment(assignmentId: string) {
  if (mongoReady) {
    const document = await AssignmentModel.findOne({ assignmentId });
    return document ? toAssignment(document) : null;
  }
  return memoryAssignments.get(assignmentId) ?? null;
}

export async function deleteAssignment(assignmentId: string) {
  if (mongoReady) {
    await AssignmentModel.deleteOne({ assignmentId });
    return;
  }
  memoryAssignments.delete(assignmentId);
}

export async function updateAssignmentStatus(
  assignmentId: string,
  status: AssignmentStatus,
  generatedPaper?: GeneratedPaper,
) {
  const existing = await getAssignment(assignmentId);
  if (!existing) return null;
  const updated: Assignment = { ...existing, status, generatedPaper: generatedPaper ?? existing.generatedPaper };
  await saveAssignment(updated);
  return updated;
}

// ─────────────────── Group CRUD ───────────────────────────────────────────────

export async function listGroups(): Promise<Group[]> {
  if (mongoReady) {
    const docs = await GroupModel.find().sort({ createdAt: 1 });
    return docs.map(toGroup);
  }
  return [...memoryGroups.values()];
}

export async function saveGroup(group: Group): Promise<void> {
  if (mongoReady) {
    await GroupModel.findOneAndUpdate(
      { groupId: group.id },
      { ...group, groupId: group.id },
      { upsert: true, new: true },
    );
    return;
  }
  memoryGroups.set(group.id, group);
}

export async function deleteGroup(id: string): Promise<void> {
  if (mongoReady) {
    await GroupModel.deleteOne({ groupId: id });
    return;
  }
  memoryGroups.delete(id);
}

// ─────────────────── LibraryDoc CRUD ─────────────────────────────────────────

export async function listLibraryDocs(): Promise<LibraryDoc[]> {
  if (mongoReady) {
    const docs = await LibraryDocModel.find().sort({ createdAt: -1 });
    return docs.map(toLibraryDoc);
  }
  return [...memoryLibraryDocs.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function saveLibraryDoc(doc: LibraryDoc): Promise<void> {
  if (mongoReady) {
    await LibraryDocModel.findOneAndUpdate(
      { docId: doc.id },
      { ...doc, docId: doc.id },
      { upsert: true, new: true },
    );
    return;
  }
  memoryLibraryDocs.set(doc.id, doc);
}

export async function deleteLibraryDoc(id: string): Promise<void> {
  if (mongoReady) {
    await LibraryDocModel.deleteOne({ docId: id });
    return;
  }
  memoryLibraryDocs.delete(id);
}

// ─────────────────── Stats ───────────────────────────────────────────────────

export async function getAppStats(): Promise<AppStats> {
  const [assignments, groups] = await Promise.all([listAssignments(), listGroups()]);
  const students = groups.reduce((s, g) => s + g.students, 0);
  const aiGenerated = assignments.filter((a) => a.status === "completed").length;
  return { assignments: assignments.length, groups: groups.length, students, aiGenerated };
}

// ─────────────────── Seeding ─────────────────────────────────────────────────

export async function seedGroupsIfEmpty() {
  const existing = await listGroups();
  if (existing.length > 0) return;

  const seeds: Group[] = [
    { id: crypto.randomUUID(), subject: "Science", className: "Grade 8", students: 32, assignments: 4, color: "#10b981", bg: "#ecfdf5", board: "CBSE", iconName: "FlaskConical", createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), subject: "Mathematics", className: "Grade 10", students: 28, assignments: 6, color: "#6366f1", bg: "#eef2ff", board: "CBSE", iconName: "Zap", createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), subject: "English", className: "Grade 7", students: 35, assignments: 3, color: "#8b5cf6", bg: "#f5f3ff", board: "ICSE", iconName: "BookOpen", createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), subject: "Physics", className: "Grade 11", students: 25, assignments: 5, color: "#0ea5e9", bg: "#f0f9ff", board: "CBSE", iconName: "Zap", createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), subject: "Chemistry", className: "Grade 9", students: 30, assignments: 4, color: "#f59e0b", bg: "#fffbeb", board: "CBSE", iconName: "FlaskConical", createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), subject: "History", className: "Grade 8", students: 38, assignments: 2, color: "#ec4899", bg: "#fdf2f8", board: "ICSE", iconName: "Landmark", createdAt: new Date().toISOString() },
  ];

  for (const g of seeds) await saveGroup(g);
}

export async function seedLibraryDocsIfEmpty() {
  const existing = await listLibraryDocs();
  if (existing.length > 0) return;

  const seeds: LibraryDoc[] = [
    { id: crypto.randomUUID(), title: "Science Question Paper", type: "paper", subject: "Science", className: "Grade 8", date: "2025-06-20", pages: 4, starred: true, createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), title: "Mathematics Quiz", type: "quiz", subject: "Mathematics", className: "Grade 10", date: "2025-06-19", pages: 2, starred: false, createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), title: "Physics Lesson Plan", type: "lesson", subject: "Physics", className: "Grade 11", date: "2025-06-18", pages: 3, starred: true, createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), title: "Chemistry Study Guide", type: "guide", subject: "Chemistry", className: "Grade 9", date: "2025-06-17", pages: 6, starred: false, createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), title: "English Assessment Rubric", type: "rubric", subject: "English", className: "Grade 7", date: "2025-06-16", pages: 2, starred: false, createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), title: "History Question Paper", type: "paper", subject: "History", className: "Grade 8", date: "2025-06-15", pages: 3, starred: true, createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), title: "Biology Quiz", type: "quiz", subject: "Biology", className: "Grade 10", date: "2025-06-14", pages: 2, starred: false, createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), title: "Math Lesson Plan", type: "lesson", subject: "Mathematics", className: "Grade 9", date: "2025-06-13", pages: 4, starred: false, createdAt: new Date().toISOString() },
  ];

  for (const d of seeds) await saveLibraryDoc(d);
}
