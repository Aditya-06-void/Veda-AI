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
  generatedPaper?: GeneratedPaper;
};

export type AssignmentFormValues = {
  schoolName: string;
  board: string;
  className: string;
  subject: string;
  dueDate: string;
  instructions: string;
  questionTypes: QuestionTypeItem[];
  file?: File | null;
};

export type Group = {
  id: string;
  subject: string;
  className: string;
  students: number;
  assignments: number;
  color: string;
  bg: string;
  board: string;
  iconName: string;
  createdAt: string;
};

export type LibraryDoc = {
  id: string;
  title: string;
  type: "paper" | "quiz" | "lesson" | "guide" | "rubric";
  subject: string;
  className: string;
  date: string;
  pages: number;
  starred: boolean;
  createdAt: string;
};

export type AppStats = {
  assignments: number;
  groups: number;
  students: number;
  aiGenerated: number;
};

export type QuestionEvaluation = {
  questionId: string;
  questionText: string;
  studentAnswer: string;
  expectedAnswer: string;
  marksAwarded: number;
  maxMarks: number;
  feedback: string;
};

export type Evaluation = {
  id: string;
  assignmentId: string;
  studentName: string;
  totalMarksAwarded: number;
  totalMaxMarks: number;
  percentage: number;
  grade: string;
  questions: QuestionEvaluation[];
  createdAt: string;
};
