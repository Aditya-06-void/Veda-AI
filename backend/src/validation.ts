import { z } from "zod";

export const questionTypeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(2),
  count: z.number().int().positive(),
  marks: z.number().int().positive(),
});

export const createAssignmentSchema = z.object({
  schoolName: z.string().min(2),
  board: z.string().min(2),
  className: z.string().min(1),
  subject: z.string().min(2),
  dueDate: z.string().min(1),
  instructions: z.string().min(10),
  fileName: z.string().optional(),
  questionTypes: z.array(questionTypeSchema).min(1),
});
