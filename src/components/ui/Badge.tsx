import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "success" | "danger";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        {
          "bg-surface text-muted": variant === "default",
          "bg-accent/10 text-accent": variant === "accent",
          "bg-success/10 text-success": variant === "success",
          "bg-danger/10 text-danger": variant === "danger",
        },
        className
      )}
      {...props}
    />
  );
}
