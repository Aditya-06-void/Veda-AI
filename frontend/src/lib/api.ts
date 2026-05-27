import { AppStats, Assignment, AssignmentFormValues, Evaluation, Group, LibraryDoc } from "./types";

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
    const raw = await response.text();
    let message = raw || "File upload failed";
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.message) message = parsed.message;
    } catch {
      // raw wasn't JSON — fall through with the text body
    }
    throw new Error(message);
  }

  return response.json() as Promise<{ assignment: Assignment; extractedChars: number }>;
}

export async function generateAssignment(assignmentId: string) {
  return request<{ assignment: Assignment }>(`/api/v1/assignments/${assignmentId}/generate`, {
    method: "POST",
  });
}

export async function regenerateAssignment(assignmentId: string, assignment?: Assignment) {
  return request<{ assignment: Assignment }>(
    `/api/v1/assignments/${assignmentId}/regenerate`,
    { method: "POST", body: JSON.stringify({ assignment }) },
  );
}

export async function submitEvaluation(assignmentId: string, studentName: string, file: File) {
  const formData = new FormData();
  formData.append("studentName", studentName);
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/api/v1/assignments/${assignmentId}/evaluate`, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = raw || "Evaluation failed";
    try { const p = JSON.parse(raw); if (p?.message) message = p.message; } catch { /* not JSON */ }
    throw new Error(message);
  }

  return response.json() as Promise<{ evaluation: Evaluation }>;
}

export async function fetchEvaluations(assignmentId: string) {
  return request<{ evaluations: Evaluation[] }>(`/api/v1/assignments/${assignmentId}/evaluations`);
}

export async function deleteEvaluation(evaluationId: string) {
  return request<{ success: boolean }>(`/api/v1/evaluations/${evaluationId}`, { method: "DELETE" });
}

export async function deleteAssignment(assignmentId: string) {
  return request<{ success: boolean }>(`/api/v1/assignments/${assignmentId}`, {
    method: "DELETE",
  });
}

export async function fetchStats() {
  return request<AppStats>("/api/v1/stats");
}

export async function fetchGroups() {
  return request<{ groups: Group[] }>("/api/v1/groups");
}

export async function createGroup(data: { subject: string; className: string; board: string; students?: number; iconName?: string; color?: string; bg?: string }) {
  return request<{ group: Group }>("/api/v1/groups", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteGroup(groupId: string) {
  return request<{ success: boolean }>(`/api/v1/groups/${groupId}`, { method: "DELETE" });
}

export async function fetchLibraryDocs() {
  return request<{ docs: LibraryDoc[] }>("/api/v1/library");
}

export async function createLibraryDoc(data: { title: string; type: LibraryDoc["type"]; subject: string; className: string; date?: string; pages?: number; starred?: boolean }) {
  return request<{ doc: LibraryDoc }>("/api/v1/library", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteLibraryDoc(docId: string) {
  return request<{ success: boolean }>(`/api/v1/library/${docId}`, { method: "DELETE" });
}
