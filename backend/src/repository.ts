import crypto from "node:crypto";

import mongoose, { Schema } from "mongoose";

import { config } from "./config";
import { AppStats, Assignment, AssignmentStatus, Evaluation, GeneratedPaper, Group, LibraryDoc } from "./types";

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

// ─────────────────── Evaluation ─────────────────────────────────────────────

type EvaluationDocument = mongoose.Document & Omit<Evaluation, "id"> & { evaluationId: string };

const questionEvalSchema = new Schema(
  { questionId: String, questionText: String, studentAnswer: String, expectedAnswer: String, marksAwarded: Number, maxMarks: Number, feedback: String },
  { _id: false },
);

const evaluationSchema = new Schema<EvaluationDocument>(
  {
    evaluationId: { type: String, unique: true, index: true },
    assignmentId: { type: String, index: true },
    studentName: String,
    totalMarksAwarded: Number,
    totalMaxMarks: Number,
    percentage: Number,
    grade: String,
    questions: [questionEvalSchema],
    createdAt: String,
  },
  { versionKey: false },
);

const EvaluationModel =
  mongoose.models.Evaluation ||
  mongoose.model<EvaluationDocument>("Evaluation", evaluationSchema);

function toEvaluation(doc: EvaluationDocument): Evaluation {
  return {
    id: doc.evaluationId,
    assignmentId: doc.assignmentId,
    studentName: doc.studentName,
    totalMarksAwarded: doc.totalMarksAwarded,
    totalMaxMarks: doc.totalMaxMarks,
    percentage: doc.percentage,
    grade: doc.grade,
    questions: doc.questions,
    createdAt: doc.createdAt,
  };
}

const memoryEvaluations = new Map<string, Evaluation>();

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

export async function seedAssignmentsIfEmpty() {
  const existing = await listAssignments();
  if (existing.length > 0) return;

  const seeds: Assignment[] = [
    // ── Completed: Science Grade 8 ────────────────────────────────────────────
    {
      id: "seed-asgn-001",
      title: "Science Question Paper",
      schoolName: "Delhi Public School",
      board: "CBSE",
      className: "Grade 8",
      subject: "Science",
      dueDate: "2026-06-20",
      instructions: "Generate a balanced question paper covering Force & Pressure, Light, and Cell Structure.",
      questionTypes: [
        { id: "qt-1", type: "Multiple Choice Questions", count: 5, marks: 1 },
        { id: "qt-2", type: "Short Questions", count: 4, marks: 2 },
        { id: "qt-3", type: "Long Questions", count: 3, marks: 5 },
      ],
      totalQuestions: 12,
      totalMarks: 28,
      createdAt: new Date("2026-05-20T10:00:00Z").toISOString(),
      status: "completed",
      generatedPaper: {
        greeting: "Here is a customised Science Question Paper for CBSE Grade 8 covering Force & Pressure, Light, and Cell Structure.",
        paperTitle: "Science Mid-Term Examination 2025-26",
        schoolName: "Delhi Public School, Bokaro Steel City",
        subject: "Science",
        className: "Grade 8",
        timeAllowed: "2 Hours",
        maximumMarks: 28,
        studentFields: ["Name", "Roll No.", "Class & Section", "Date"],
        sections: [
          {
            id: "s1",
            title: "Multiple Choice Questions",
            instruction: "Choose the correct answer. Each question carries 1 mark.",
            questions: [
              { id: "q1", text: "Which of the following is an example of a contact force?", difficulty: "Easy", marks: 1, answer: "b) Friction" },
              { id: "q2", text: "The SI unit of pressure is:", difficulty: "Easy", marks: 1, answer: "c) Pascal (Pa)" },
              { id: "q3", text: "Which part of the cell controls all cell activities?", difficulty: "Easy", marks: 1, answer: "a) Nucleus" },
              { id: "q4", text: "Photosynthesis takes place in the:", difficulty: "Moderate", marks: 1, answer: "b) Chloroplast" },
              { id: "q5", text: "The speed of light in vacuum is approximately:", difficulty: "Easy", marks: 1, answer: "c) 3 × 10⁸ m/s" },
            ],
          },
          {
            id: "s2",
            title: "Short Answer Questions",
            instruction: "Answer in 2–3 sentences. Each question carries 2 marks.",
            questions: [
              { id: "q6", text: "Define pressure and write its SI unit.", difficulty: "Easy", marks: 2, answer: "Pressure is the force applied per unit area. P = F/A. SI unit is Pascal (Pa)." },
              { id: "q7", text: "What is photosynthesis? Write the balanced chemical equation.", difficulty: "Moderate", marks: 2, answer: "Photosynthesis is the process by which green plants make food. 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂" },
              { id: "q8", text: "Differentiate between concave and convex lenses.", difficulty: "Moderate", marks: 2, answer: "Concave lens: thicker at edges, diverges light. Convex lens: thicker at centre, converges light." },
              { id: "q9", text: "State two differences between plant and animal cells.", difficulty: "Moderate", marks: 2, answer: "Plant cells have a cell wall and chloroplasts; animal cells do not. Animal cells have centrioles; plant cells generally do not." },
            ],
          },
          {
            id: "s3",
            title: "Long Answer Questions",
            instruction: "Answer in detail with diagrams where necessary. Each question carries 5 marks.",
            questions: [
              { id: "q10", text: "Explain image formation by a concave mirror for different positions of the object. Use ray diagrams to support your answer.", difficulty: "Challenging", marks: 5, answer: "Object at ∞: image at F (real, inverted, point-sized). Object beyond C: image between F & C (real, inverted, diminished). Object at C: image at C (real, inverted, same size). Object between C & F: image beyond C (real, inverted, enlarged). Object at F: image at ∞. Object between F & mirror: image behind mirror (virtual, erect, enlarged)." },
              { id: "q11", text: "Describe the structure and functions of the following cell organelles: Nucleus, Mitochondria, and Chloroplast.", difficulty: "Challenging", marks: 5, answer: "Nucleus: surrounded by nuclear membrane, contains chromosomes, controls cell activities. Mitochondria: double-membraned, site of aerobic respiration, ATP production — 'powerhouse of cell'. Chloroplast: double-membraned, contains chlorophyll, site of photosynthesis, found only in plant cells." },
              { id: "q12", text: "State Newton's three laws of motion and illustrate each with a daily-life example.", difficulty: "Challenging", marks: 5, answer: "1st Law (Inertia): body at rest/motion stays so unless acted on. Ex: passengers jerk when bus stops. 2nd Law: F = ma. Ex: heavier ball needs more force. 3rd Law: action = −reaction. Ex: rocket propulsion. Equations: F = ma; impulse = FΔt." },
            ],
          },
        ],
        answerKey: [
          { id: "ak1", text: "b) Friction" },
          { id: "ak2", text: "c) Pascal (Pa)" },
          { id: "ak3", text: "a) Nucleus" },
          { id: "ak4", text: "b) Chloroplast" },
          { id: "ak5", text: "c) 3 × 10⁸ m/s" },
          { id: "ak6", text: "P = F/A; SI unit Pascal (Pa)" },
          { id: "ak7", text: "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ (sunlight + chlorophyll)" },
          { id: "ak8", text: "Concave diverges; Convex converges" },
          { id: "ak9", text: "Cell wall & chloroplasts in plant; centrioles in animal" },
          { id: "ak10", text: "See ray diagrams for each of the 6 object positions" },
          { id: "ak11", text: "Nucleus: control; Mitochondria: ATP; Chloroplast: photosynthesis" },
          { id: "ak12", text: "Law 1: inertia; Law 2: F = ma; Law 3: action-reaction" },
        ],
      },
    },

    // ── Completed: Mathematics Grade 10 ──────────────────────────────────────
    {
      id: "seed-asgn-002",
      title: "Mathematics Mid-Term Paper",
      schoolName: "Delhi Public School",
      board: "CBSE",
      className: "Grade 10",
      subject: "Mathematics",
      dueDate: "2026-06-25",
      instructions: "Focus on Quadratic Equations, Trigonometry, and Coordinate Geometry.",
      questionTypes: [
        { id: "qt-1", type: "Multiple Choice Questions", count: 5, marks: 1 },
        { id: "qt-2", type: "Short Questions", count: 3, marks: 3 },
        { id: "qt-3", type: "Numerical Problems", count: 4, marks: 5 },
      ],
      totalQuestions: 12,
      totalMarks: 34,
      createdAt: new Date("2026-05-22T09:00:00Z").toISOString(),
      status: "completed",
      generatedPaper: {
        greeting: "Here is a customised Mathematics Mid-Term Paper for CBSE Grade 10 focusing on Quadratic Equations, Trigonometry, and Coordinate Geometry.",
        paperTitle: "Mathematics Mid-Term Examination 2025-26",
        schoolName: "Delhi Public School, Bokaro Steel City",
        subject: "Mathematics",
        className: "Grade 10",
        timeAllowed: "3 Hours",
        maximumMarks: 34,
        studentFields: ["Name", "Roll No.", "Class & Section", "Date"],
        sections: [
          {
            id: "s1",
            title: "Multiple Choice Questions",
            instruction: "Choose the correct answer. Each question carries 1 mark.",
            questions: [
              { id: "q1", text: "The roots of the equation x² − 5x + 6 = 0 are:", difficulty: "Easy", marks: 1, answer: "b) 2 and 3" },
              { id: "q2", text: "The value of sin 30° × cos 60° is:", difficulty: "Easy", marks: 1, answer: "a) 1/4" },
              { id: "q3", text: "The distance between points A(3, 4) and B(0, 0) is:", difficulty: "Easy", marks: 1, answer: "c) 5" },
              { id: "q4", text: "If the discriminant of a quadratic equation is negative, the roots are:", difficulty: "Moderate", marks: 1, answer: "b) Non-real (complex)" },
              { id: "q5", text: "The slope of a line passing through (2, 3) and (4, 7) is:", difficulty: "Moderate", marks: 1, answer: "c) 2" },
            ],
          },
          {
            id: "s2",
            title: "Short Answer Questions",
            instruction: "Show all working. Each question carries 3 marks.",
            questions: [
              { id: "q6", text: "Solve the quadratic equation 2x² − 7x + 3 = 0 using the quadratic formula.", difficulty: "Moderate", marks: 3, answer: "x = (7 ± √(49−24)) / 4 = (7 ± 5) / 4 → x = 3 or x = 1/2" },
              { id: "q7", text: "Prove that (sin θ + cos θ)² + (sin θ − cos θ)² = 2.", difficulty: "Moderate", marks: 3, answer: "LHS = sin²θ + 2sinθcosθ + cos²θ + sin²θ − 2sinθcosθ + cos²θ = 2(sin²θ + cos²θ) = 2 = RHS" },
              { id: "q8", text: "Find the centroid of the triangle with vertices A(2, 4), B(6, 2), C(4, 8).", difficulty: "Moderate", marks: 3, answer: "Centroid = ((2+6+4)/3, (4+2+8)/3) = (4, 14/3) ≈ (4, 4.67)" },
            ],
          },
          {
            id: "s3",
            title: "Numerical Problems",
            instruction: "Solve the following problems with complete steps. Each question carries 5 marks.",
            questions: [
              { id: "q9", text: "A train travels 360 km at a uniform speed. If the speed had been 5 km/h more, it would have taken 1 hour less. Find the original speed of the train.", difficulty: "Challenging", marks: 5, answer: "Let speed = x km/h. 360/x − 360/(x+5) = 1 → x² + 5x − 1800 = 0 → (x+45)(x−40) = 0 → x = 40 km/h" },
              { id: "q10", text: "From a point on the ground, the angle of elevation of the top of a 30 m tall building is 30°. Find the distance of the point from the base of the building.", difficulty: "Challenging", marks: 5, answer: "tan 30° = 30/d → d = 30/tan30° = 30√3 ≈ 51.96 m" },
              { id: "q11", text: "Find the area of the triangle formed by the points P(1, 1), Q(4, 4), R(4, 1) using the coordinate geometry formula.", difficulty: "Moderate", marks: 5, answer: "Area = ½|x₁(y₂−y₃) + x₂(y₃−y₁) + x₃(y₁−y₂)| = ½|1(4−1) + 4(1−1) + 4(1−4)| = ½|3 + 0 − 12| = 4.5 sq units" },
              { id: "q12", text: "The sum of the ages of a father and his son is 45 years. Five years ago, the product of their ages was 124. Find their present ages.", difficulty: "Challenging", marks: 5, answer: "Let son = x, father = 45−x. (x−5)(40−x) = 124 → x² − 45x + 324 = 0 → (x−9)(x−36) = 0 → son = 9, father = 36" },
            ],
          },
        ],
        answerKey: [
          { id: "ak1", text: "b) 2 and 3" },
          { id: "ak2", text: "a) 1/4" },
          { id: "ak3", text: "c) 5" },
          { id: "ak4", text: "b) Non-real (complex)" },
          { id: "ak5", text: "c) 2" },
          { id: "ak6", text: "x = 3 or x = 1/2" },
          { id: "ak7", text: "2(sin²θ + cos²θ) = 2" },
          { id: "ak8", text: "(4, 14/3)" },
          { id: "ak9", text: "40 km/h" },
          { id: "ak10", text: "30√3 ≈ 51.96 m" },
          { id: "ak11", text: "4.5 square units" },
          { id: "ak12", text: "Son = 9 years, Father = 36 years" },
        ],
      },
    },

    // ── Completed: English Literature Grade 7 ────────────────────────────────
    {
      id: "seed-asgn-003",
      title: "English Literature Paper",
      schoolName: "Delhi Public School",
      board: "ICSE",
      className: "Grade 7",
      subject: "English",
      dueDate: "2026-06-18",
      instructions: "Cover comprehension, grammar, and essay writing for the mid-term.",
      questionTypes: [
        { id: "qt-1", type: "Short Questions", count: 3, marks: 2 },
        { id: "qt-2", type: "Short Questions", count: 4, marks: 2 },
        { id: "qt-3", type: "Long Questions", count: 2, marks: 5 },
      ],
      totalQuestions: 9,
      totalMarks: 24,
      createdAt: new Date("2026-05-24T11:00:00Z").toISOString(),
      status: "completed",
      generatedPaper: {
        greeting: "Here is a customised English Literature and Language Paper for ICSE Grade 7.",
        paperTitle: "English Mid-Term Examination 2025-26",
        schoolName: "Delhi Public School, Bokaro Steel City",
        subject: "English",
        className: "Grade 7",
        timeAllowed: "2 Hours",
        maximumMarks: 24,
        studentFields: ["Name", "Roll No.", "Class & Section", "Date"],
        sections: [
          {
            id: "s1",
            title: "Reading Comprehension",
            instruction: "Read the passage carefully and answer the questions. Each question carries 2 marks.",
            questions: [
              { id: "q1", text: "What is the central theme of the passage about the importance of trees in our ecosystem?", difficulty: "Easy", marks: 2, answer: "Trees are vital for maintaining ecological balance — they produce oxygen, absorb CO₂, prevent soil erosion, and provide habitat for wildlife." },
              { id: "q2", text: "Give the meaning of the word 'canopy' as used in the passage.", difficulty: "Easy", marks: 2, answer: "Canopy refers to the upper layer of foliage formed by the branches and leaves of tall trees, creating a roof-like covering in a forest." },
              { id: "q3", text: "How does the author suggest individuals can contribute to protecting forests?", difficulty: "Moderate", marks: 2, answer: "The author suggests planting saplings, reducing paper waste, supporting reforestation programs, and raising awareness about deforestation." },
            ],
          },
          {
            id: "s2",
            title: "Grammar and Language",
            instruction: "Answer the following grammar questions. Each question carries 2 marks.",
            questions: [
              { id: "q4", text: "Change the following sentence to passive voice: 'The teacher explained the lesson clearly.'", difficulty: "Easy", marks: 2, answer: "The lesson was explained clearly by the teacher." },
              { id: "q5", text: "Identify and correct the error in this sentence: 'Neither the boys nor the girl were present.'", difficulty: "Moderate", marks: 2, answer: "Error: 'were' should be 'was'. Corrected: 'Neither the boys nor the girl was present.' (verb agrees with the noun closest to it)" },
              { id: "q6", text: "Use the word 'resilient' in a meaningful sentence and explain its meaning.", difficulty: "Moderate", marks: 2, answer: "Example: 'Despite the hardships, she remained resilient and continued working towards her goal.' Meaning: able to recover quickly from difficulties; strong and flexible." },
              { id: "q7", text: "Combine the following sentences using an appropriate conjunction: 'She was tired. She finished all her homework.'", difficulty: "Easy", marks: 2, answer: "Although she was tired, she finished all her homework. / She was tired, yet she finished all her homework." },
            ],
          },
          {
            id: "s3",
            title: "Essay Writing",
            instruction: "Write essays on the following topics. Each essay carries 5 marks.",
            questions: [
              { id: "q8", text: "Write an essay of about 150 words on the topic: 'The Importance of Kindness in Daily Life'.", difficulty: "Moderate", marks: 5, answer: "A well-structured essay covering: definition of kindness, examples of small acts (helping elders, encouraging peers), effect on mental health of giver and receiver, kindness in schools and communities, conclusion emphasising that kindness costs nothing but means everything." },
              { id: "q9", text: "Write a letter to your school principal requesting permission to organise an environment awareness drive in your school campus.", difficulty: "Challenging", marks: 5, answer: "Format: Date, To (The Principal), Subject, Body (reason for drive, plan of activities, expected outcomes, responsible conduct assured), Yours sincerely, Name/Class. Content should include specific environmental issues, proposed activities like plantation drives, poster competitions, etc." },
            ],
          },
        ],
        answerKey: [
          { id: "ak1", text: "Ecological balance — oxygen, CO₂ absorption, habitat" },
          { id: "ak2", text: "Upper layer of tree foliage forming a roof-like cover" },
          { id: "ak3", text: "Planting saplings, reducing paper waste, supporting reforestation" },
          { id: "ak4", text: "The lesson was explained clearly by the teacher." },
          { id: "ak5", text: "'were' → 'was' (verb agrees with nearest noun)" },
          { id: "ak6", text: "Resilient = able to recover from difficulties (sample sentence provided)" },
          { id: "ak7", text: "Although she was tired, she finished all her homework." },
          { id: "ak8", text: "Essay: definition, examples, effects on giver/receiver, conclusion" },
          { id: "ak9", text: "Formal letter with date, salutation, subject, body, closing" },
        ],
      },
    },

    // ── Draft: Physics Grade 11 ───────────────────────────────────────────────
    {
      id: "seed-asgn-004",
      title: "Physics Assessment Paper",
      schoolName: "Delhi Public School",
      board: "CBSE",
      className: "Grade 11",
      subject: "Physics",
      dueDate: "2026-07-05",
      instructions: "Focus on Laws of Motion, Work & Energy, and Gravitation.",
      questionTypes: [
        { id: "qt-1", type: "Multiple Choice Questions", count: 5, marks: 1 },
        { id: "qt-2", type: "Short Questions", count: 5, marks: 3 },
        { id: "qt-3", type: "Numerical Problems", count: 4, marks: 5 },
      ],
      totalQuestions: 14,
      totalMarks: 40,
      createdAt: new Date("2026-05-25T08:00:00Z").toISOString(),
      status: "draft",
    },

    // ── Draft: Chemistry Grade 9 ──────────────────────────────────────────────
    {
      id: "seed-asgn-005",
      title: "Chemistry Quiz",
      schoolName: "Delhi Public School",
      board: "CBSE",
      className: "Grade 9",
      subject: "Chemistry",
      dueDate: "2026-07-01",
      instructions: "Cover Matter, Atoms & Molecules, and Structure of the Atom.",
      questionTypes: [
        { id: "qt-1", type: "Multiple Choice Questions", count: 4, marks: 1 },
        { id: "qt-2", type: "Short Questions", count: 3, marks: 2 },
        { id: "qt-3", type: "Assertion & Reasoning", count: 3, marks: 2 },
      ],
      totalQuestions: 10,
      totalMarks: 16,
      createdAt: new Date("2026-05-26T07:00:00Z").toISOString(),
      status: "draft",
    },
  ];

  for (const a of seeds) await saveAssignment(a);
}

// ─────────────────── Evaluation CRUD ─────────────────────────────────────────

export async function saveEvaluation(evaluation: Evaluation) {
  if (mongoReady) {
    await EvaluationModel.findOneAndUpdate(
      { evaluationId: evaluation.id },
      { ...evaluation, evaluationId: evaluation.id },
      { upsert: true, new: true },
    );
  } else {
    memoryEvaluations.set(evaluation.id, evaluation);
  }
  return evaluation;
}

export async function listEvaluationsForAssignment(assignmentId: string): Promise<Evaluation[]> {
  if (mongoReady) {
    const docs = await EvaluationModel.find({ assignmentId }).sort({ createdAt: -1 });
    return docs.map(toEvaluation);
  }
  return [...memoryEvaluations.values()]
    .filter((e) => e.assignmentId === assignmentId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function deleteEvaluation(evaluationId: string) {
  if (mongoReady) {
    await EvaluationModel.deleteOne({ evaluationId });
    return;
  }
  memoryEvaluations.delete(evaluationId);
}
