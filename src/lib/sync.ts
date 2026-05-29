import { apiPost, apiPut, apiDelete } from "./api";
import { getMutationQueue, removeFromQueue } from "./offline";

export async function flushMutationQueue(): Promise<{ success: number; failed: number }> {
  const queue = getMutationQueue();
  let success = 0;
  let failed = 0;

  for (const mutation of queue) {
    try {
      if (mutation.method === "POST") {
        await apiPost(mutation.endpoint, mutation.payload);
      } else if (mutation.method === "PUT") {
        await apiPut(mutation.endpoint, mutation.payload);
      } else if (mutation.method === "DELETE") {
        await apiDelete(mutation.endpoint);
      }
      removeFromQueue(mutation.id);
      success++;
    } catch {
      failed++;
    }
  }

  return { success, failed };
}
