const CACHE_PREFIX = "offline:cache:";
const QUEUE_KEY = "offline:mutation-queue";
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedItem<T> {
  data: T;
  cachedAt: number;
}

export interface QueuedMutation {
  id: string;
  endpoint: string;
  method: "POST" | "PUT" | "DELETE";
  payload: unknown;
  timestamp: number;
}

export function cacheResponse<T>(key: string, data: T, _ttlMs = DEFAULT_TTL_MS): void {
  try {
    const item: CachedItem<T> = { data, cachedAt: Date.now() };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
  } catch {
    // localStorage full or unavailable
  }
}

export function getCachedResponse<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const item: CachedItem<T> = JSON.parse(raw);
    if (Date.now() - item.cachedAt > ttlMs) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    return item.data;
  } catch {
    return null;
  }
}

export function clearCache(key?: string): void {
  try {
    if (key) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } else {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k?.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(k);
        }
      }
    }
  } catch {
    // ignore
  }
}

export function queueMutation(mutation: Omit<QueuedMutation, "id" | "timestamp">): void {
  try {
    const queue = getMutationQueue();
    const item: QueuedMutation = {
      ...mutation,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
    };
    queue.push(item);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage full
  }
}

export function getMutationQueue(): QueuedMutation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function removeFromQueue(id: string): void {
  try {
    const queue = getMutationQueue().filter((m) => m.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // ignore
  }
}

export function clearMutationQueue(): void {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    // ignore
  }
}

export function isOfflineError(error: unknown): boolean {
  if (!navigator.onLine) return true;
  if (error instanceof TypeError) {
    // Network failure (fetch throws TypeError for network issues)
    return true;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("fetch") ||
      msg.includes("network") ||
      msg.includes("failed to fetch") ||
      msg.includes("abort")
    );
  }
  return false;
}
