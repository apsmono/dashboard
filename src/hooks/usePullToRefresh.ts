import { useState, useEffect, useRef, useCallback } from "react";

const PULL_THRESHOLD = 80;

export function usePullToRefresh(onRefresh: () => void | Promise<void>) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isRefreshing = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0 && startY.current > 0) {
      const diff = e.touches[0].clientY - startY.current;
      if (diff > 0) {
        setPulling(true);
        setPullDistance(Math.min(diff * 0.5, PULL_THRESHOLD + 20));
      }
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing.current) {
      isRefreshing.current = true;
      await onRefresh();
      isRefreshing.current = false;
    }
    setPulling(false);
    setPullDistance(0);
    startY.current = 0;
  }, [pullDistance, onRefresh]);

  useEffect(() => {
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { pulling, pullDistance };
}
