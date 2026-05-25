import { QuestionTypeItem } from "./types";

export const schoolProfile = {
  schoolName: "Delhi Public School",
  campus: "Bokaro Steel City",
  teacher: "John Doe",
  avatarText: "JD",
};

export const defaultQuestionTypes: QuestionTypeItem[] = [
  { id: "qt-1", type: "Multiple Choice Questions", count: 4, marks: 1 },
  { id: "qt-2", type: "Short Questions", count: 3, marks: 2 },
  { id: "qt-3", type: "Diagram/Graph-Based Questions", count: 5, marks: 5 },
  { id: "qt-4", type: "Numerical Problems", count: 5, marks: 5 },
];

export const boardOptions = ["CBSE", "ICSE", "State Board", "IB", "IGCSE"];

export const classOptions = [
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
  "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10",
  "Grade 11", "Grade 12",
];

export const subjectOptions = [
  "Mathematics", "Science", "Physics", "Chemistry", "Biology",
  "English", "Hindi", "History", "Geography", "Social Science",
  "Computer Science", "Economics", "Accountancy", "Political Science",
  "Environmental Science", "Physical Education",
];

export const questionTypeOptions = [
  "Multiple Choice Questions",
  "Short Questions",
  "Long Questions",
  "Diagram/Graph-Based Questions",
  "Numerical Problems",
  "Assertion & Reasoning",
  "Case Study Questions",
];

