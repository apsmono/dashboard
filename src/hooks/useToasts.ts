import { useCallback, useState } from "react";

export interface ToastItem {
  id: number;
  message: string;
  variant: "success" | "error";
}

/** Minimal local toast state — no provider; render <Toasts> next to the hook's owner. */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback(
    (message: string, variant: ToastItem["variant"] = "success") => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, message, variant }]);
      window.setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, 3500);
    },
    []
  );

  return { toasts, push };
}
