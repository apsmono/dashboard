import { Loader2 } from "lucide-react";

interface PullIndicatorProps {
  distance: number;
}

export function PullIndicator({ distance }: PullIndicatorProps) {
  if (distance <= 0) return null;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-all"
      style={{ height: distance }}
    >
      <Loader2
        size={20}
        className={`animate-spin text-accent transition-opacity ${
          distance >= 80 ? "opacity-100" : "opacity-40"
        }`}
      />
    </div>
  );
}
