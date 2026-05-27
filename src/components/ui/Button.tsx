import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50",
        {
          "bg-accent text-white hover:opacity-90": variant === "primary",
          "bg-card text-text border border-border hover:border-accent": variant === "secondary",
          "bg-transparent text-muted border border-border hover:text-text": variant === "ghost",
          "bg-transparent text-danger border border-danger hover:bg-banner-error-bg": variant === "danger",
          "px-3 py-1.5 text-sm": size === "sm",
          "px-4 py-2 text-base": size === "md",
          "px-6 py-3 text-lg": size === "lg",
        },
        className
      )}
      {...props}
    />
  );
}
