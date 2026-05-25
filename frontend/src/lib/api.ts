import { Assignment, AssignmentFormValues } from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return response.json() as Promise<T>;
}

export async function fetchAssignments(page?: number, limit?: number) {
  const params = new URLSearchParams();
  if (page !== undefined) params.set("page", String(page));
  if (limit !== undefined) params.set("limit", String(limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return request<{
    assignments: Assignment[];
    pagination?: { page: number; limit: number; total: number; pages: number };
  }>(`/api/v1/assignments${query}`);
}

export async function createAssignment(values: AssignmentFormValues) {
  return request<{ assignment: Assignment }>("/api/v1/assignments", {
    method: "POST",
    body: JSON.stringify({
      schoolName: values.schoolName,
      board: values.board,
      className: values.className,
      subject: values.subject,
      dueDate: values.dueDate,
      instructions: values.instructions,
      questionTypes: values.questionTypes,
      fileName: values.file?.name,
    }),
  });
}

export async function uploadAssignmentFile(assignmentId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/api/v1/assignments/${assignmentId}/upload`, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "File upload failed");
  }

  return response.json() as Promise<{ assignment: Assignment; extractedChars: number }>;
}

export async function generateAssignment(assignmentId: string) {
  return request<{ assignment: Assignment }>(`/api/v1/assignments/${assignmentId}/generate`, {
    method: "POST",
  });
}

export async function regenerateAssignment(assignmentId: string) {
  return request<{ assignment: Assignment }>(
    `/api/v1/assignments/${assignmentId}/regenerate`,
    { method: "POST" },
  );
}

export async function deleteAssignment(assignmentId: string) {
  return request<{ success: boolean }>(`/api/v1/assignments/${assignmentId}`, {
    method: "DELETE",
  });
}
