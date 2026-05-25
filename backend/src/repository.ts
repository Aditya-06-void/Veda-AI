import mongoose, { Schema } from "mongoose";

import { config } from "./config";
import { Assignment, AssignmentStatus, GeneratedPaper } from "./types";

type AssignmentDocument = mongoose.Document &
  Omit<Assignment, "id"> & {
    assignmentId: string;
  };

const questionTypeSchema = new Schema(
  {
    id: String,
    type: String,
    count: Number,
    marks: Number,
  },
  { _id: false },
);

const questionSchema = new Schema(
  {
    id: String,
    text: String,
    difficulty: String,
    marks: Number,
    answer: String,
  },
  { _id: false },
);

const sectionSchema = new Schema(
  {
    id: String,
    title: String,
    instruction: String,
    questions: [questionSchema],
  },
  { _id: false },
);

const answerKeySchema = new Schema(
  {
    id: String,
    text: String,
  },
  { _id: false },
);

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
    generatedPaper,
  };
}

const memoryAssignments = new Map<string, Assignment>();

export async function listAssignments() {
  if (mongoReady) {
    const documents = await AssignmentModel.find().sort({ createdAt: -1 });
    return documents.map(toAssignment);
  }

  return [...memoryAssignments.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
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

  if (!existing) {
    return null;
  }

  const updated: Assignment = {
    ...existing,
    status,
    generatedPaper: generatedPaper ?? existing.generatedPaper,
  };

  await saveAssignment(updated);
  return updated;
}
