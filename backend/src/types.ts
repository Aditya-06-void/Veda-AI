export type AssignmentStatus =
  | "draft"
  | "queued"
  | "generating"
  | "completed"
  | "failed";

export type QuestionDifficulty = "Easy" | "Moderate" | "Challenging";

export type QuestionTypeItem = {
  id: string;
  type: string;
  count: number;
  marks: number;
};

export type GeneratedQuestion = {
  id: string;
  text: string;
  difficulty: QuestionDifficulty;
  marks: number;
  answer: string;
};

export type GeneratedSection = {
  id: string;
  title: string;
  instruction: string;
  questions: GeneratedQuestion[];
};

export type GeneratedPaper = {
  greeting: string;
  paperTitle: string;
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;
  maximumMarks: number;
  studentFields: string[];
  sections: GeneratedSection[];
  answerKey: { id: string; text: string }[];
};

export type Assignment = {
  id: string;
  title: string;
  schoolName: string;
  board: string;
  className: string;
  subject: string;
  dueDate: string;
  instructions: string;
  questionTypes: QuestionTypeItem[];
  totalQuestions: number;
  totalMarks: number;
  createdAt: string;
  status: AssignmentStatus;
  fileName?: string;
  extractedText?: string;
  generatedPaper?: GeneratedPaper;
};

export type CreateAssignmentInput = {
  schoolName: string;
  board: string;
  className: string;
  subject: string;
  dueDate: string;
  instructions: string;
  questionTypes: QuestionTypeItem[];
  fileName?: string;
  extractedText?: string;
};
