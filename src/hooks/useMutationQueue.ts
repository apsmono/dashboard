import { useState, useCallback, useEffect } from "react";
import {
  getMutationQueue,
  removeFromQueue,
  queueMutation as _queueMutation,
  QueuedMutation,
} from "@/lib/offline";

export function useMutationQueue() {
  const [queue, setQueue] = useState<QueuedMutation[]>([]);

  const refresh = useCallback(() => {
    setQueue(getMutationQueue());
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [refresh]);

  const enqueue = useCallback((mutation: Omit<QueuedMutation, "id" | "timestamp">) => {
    _queueMutation(mutation);
    refresh();
  }, [refresh]);

  const dequeue = useCallback((id: string) => {
    removeFromQueue(id);
    refresh();
  }, [refresh]);

  const flush = useCallback(
    async (executor: (mutation: QueuedMutation) => Promise<unknown>) => {
      const pending = getMutationQueue();
      const failed: QueuedMutation[] = [];

      for (const mutation of pending) {
        try {
          await executor(mutation);
          removeFromQueue(mutation.id);
        } catch {
          failed.push(mutation);
        }
      }

      refresh();
      return { success: failed.length === 0, failed };
    },
    [refresh]
  );

  return { queue, count: queue.length, enqueue, dequeue, flush, refresh };
}
