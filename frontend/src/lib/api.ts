import { Assignment, AssignmentFormValues } from "./types";

const API_BASE =
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

export async function fetchAssignments() {
  return request<{ assignments: Assignment[] }>("/api/assignments");
}

export async function createAssignment(values: AssignmentFormValues) {
  return request<{ assignment: Assignment }>("/api/assignments", {
    method: "POST",
    body: JSON.stringify({
      ...values,
      fileName: values.file?.name,
    }),
  });
}

export async function generateAssignment(assignmentId: string) {
  return request<{ assignment: Assignment }>(`/api/assignments/${assignmentId}/generate`, {
    method: "POST",
  });
}

export async function regenerateAssignment(assignmentId: string) {
  return request<{ assignment: Assignment }>(
    `/api/assignments/${assignmentId}/regenerate`,
    {
      method: "POST",
    },
  );
}

export async function deleteAssignment(assignmentId: string) {
  return request<{ success: boolean }>(`/api/assignments/${assignmentId}`, {
    method: "DELETE",
  });
}
