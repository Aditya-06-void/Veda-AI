import { Queue, Worker } from "bullmq";

import { getRedisConnection } from "./cache";
import { generateQuestionPaper } from "./generator";
import { getAssignment, updateAssignmentStatus } from "./repository";
import type { Assignment } from "./types";

type QueueHandlers = {
  onAssignmentUpdate: (assignment: Assignment) => Promise<void> | void;
};

let queue: Queue | null = null;
let worker: Worker | null = null;
let fallbackHandlers: QueueHandlers | null = null;

export async function initializeQueue(handlers: QueueHandlers) {
  const connection = getRedisConnection();

  if (connection) {
    queue = new Queue("assignment-generation", { connection });
    worker = new Worker(
      "assignment-generation",
      async (job) => {
        const assignment = await getAssignment(job.data.assignmentId);
        if (!assignment) return;

        const updatedGenerating = await updateAssignmentStatus(
          assignment.id,
          "generating",
        );
        if (updatedGenerating) {
          await handlers.onAssignmentUpdate(updatedGenerating);
        }

        const generatedPaper = await generateQuestionPaper(assignment);
        const completed = await updateAssignmentStatus(
          assignment.id,
          "completed",
          generatedPaper,
        );
        if (completed) {
          await handlers.onAssignmentUpdate(completed);
        }
      },
      { connection },
    );
  } else {
    fallbackHandlers = handlers;
  }
}

export async function enqueueGeneration(assignmentId: string) {
  const assignment = await getAssignment(assignmentId);
  if (!assignment) return null;

  const queued = await updateAssignmentStatus(assignmentId, "queued");

  if (queue) {
    await queue.add("generate-paper", { assignmentId });
    return queued;
  }

  if (fallbackHandlers && queued) {
    setTimeout(async () => {
      const generating = await updateAssignmentStatus(assignmentId, "generating");
      if (generating) {
        await fallbackHandlers?.onAssignmentUpdate(generating);
      }

      const freshAssignment = await getAssignment(assignmentId);
      if (!freshAssignment) return;

      const generatedPaper = await generateQuestionPaper(freshAssignment);
      const completed = await updateAssignmentStatus(
        assignmentId,
        "completed",
        generatedPaper,
      );
      if (completed) {
        await fallbackHandlers?.onAssignmentUpdate(completed);
      }
    }, 1200);
  }

  return queued;
}
