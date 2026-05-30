import type { ReactNode } from "react";
import { Play, GitBranch, Globe } from "lucide-react";

export type SortMode = "newest" | "oldest" | "title_asc" | "title_desc";

export function platformIcon(source_url?: string): ReactNode {
  if (!source_url) return null;
  if (source_url.includes("youtube.com") || source_url.includes("youtu.be")) {
    return <Play size={13} className="text-red-400" />;
  }
  if (source_url.includes("github.com")) {
    return <GitBranch size={13} className="text-text" />;
  }
  return <Globe size={13} className="text-muted" />;
}

export function platformLabel(source_url?: string): string {
  if (!source_url) return "";
  if (source_url.includes("youtube.com") || source_url.includes("youtu.be")) {
    return "YouTube";
  }
  if (source_url.includes("github.com")) return "GitHub";
  try {
    const host = new URL(source_url).hostname.replace(/^www\./, "");
    return host;
  } catch {
    return "";
  }
}

export function youtubeThumbnail(source_url?: string): string | null {
  if (!source_url) return null;
  let videoId: string | null = null;
  if (source_url.includes("youtube.com/watch")) {
    const url = new URL(source_url);
    videoId = url.searchParams.get("v");
  } else if (source_url.includes("youtu.be/")) {
    videoId = source_url.split("youtu.be/")[1]?.split("?")[0];
  }
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

export function sectionAccentColor(section: string): string {
  const colors: Record<string, string> = {
    profile: "border-l-blue-500",
    terms: "border-l-purple-500",
    books: "border-l-amber-500",
    articles: "border-l-emerald-500",
    thoughts: "border-l-pink-500",
    references: "border-l-cyan-500",
  };
  return colors[section] || "border-l-accent";
}

export function sectionAccentBg(section: string): string {
  const colors: Record<string, string> = {
    profile: "bg-blue-500/10 text-blue-400",
    terms: "bg-purple-500/10 text-purple-400",
    books: "bg-amber-500/10 text-amber-400",
    articles: "bg-emerald-500/10 text-emerald-400",
    thoughts: "bg-pink-500/10 text-pink-400",
    references: "bg-cyan-500/10 text-cyan-400",
  };
  return colors[section] || "bg-accent/10 text-accent";
}

/** Return a human-readable relative time string (e.g. "3 days ago", "just now"). */
export function relativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  const units: [string, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, seconds] of units) {
    const value = Math.floor(diffSec / seconds);
    if (value >= 1) {
      return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(-value, unit as Intl.RelativeTimeFormatUnit);
    }
  }
  return "just now";
}

/** Generate page numbers with ellipsis for pagination */
export function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [];
  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push("ellipsis");
    pages.push(total);
  } else if (current >= total - 3) {
    pages.push(1);
    pages.push("ellipsis");
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push("ellipsis");
    for (let i = current - 1; i <= current + 1; i++) pages.push(i);
    pages.push("ellipsis");
    pages.push(total);
  }
  return pages;
}
