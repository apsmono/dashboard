import { useMemo } from "react";
import { useDashboardStats, useTasks, useHabits, useTimeline } from "./useApi";
import type { GamificationState } from "@/types";

const LEVEL_THRESHOLDS = [
  { level: 1, minXp: 0, label: "Novice" },
  { level: 2, minXp: 100, label: "Explorer" },
  { level: 3, minXp: 250, label: "Collector" },
  { level: 4, minXp: 500, label: "Apprentice" },
  { level: 5, minXp: 1000, label: "Scholar" },
  { level: 6, minXp: 2000, label: "Adept" },
  { level: 7, minXp: 3500, label: "Expert" },
  { level: 8, minXp: 5500, label: "Sage" },
  { level: 9, minXp: 8000, label: "Master" },
  { level: 10, minXp: 11000, label: "Grandmaster" },
];

function computeStreak(dailyCounts: Record<string, number>): number {
  const dates = Object.keys(dailyCounts).sort();
  if (dates.length === 0) return 0;

  const today = new Date();
  let current = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const str = d.toISOString().split("T")[0];
    if ((dailyCounts[str] ?? 0) > 0) {
      current++;
    } else if (i > 0) {
      break;
    }
  }
  return current;
}

export function useGamification(): GamificationState & { loading: boolean } {
  const { data: stats, loading: statsLoading } = useDashboardStats();
  const { data: tasksData, loading: tasksLoading } = useTasks();
  const { data: habitsData, loading: habitsLoading } = useHabits();

  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - 365);
  const fromStr = fromDate.toISOString().split("T")[0];
  const toStr = today.toISOString().split("T")[0];
  const { data: timelineData, loading: timelineLoading } = useTimeline({
    from_date: fromStr,
    to_date: toStr,
  });

  const loading = statsLoading || tasksLoading || habitsLoading || timelineLoading;

  return useMemo(() => {
    const library = stats?.library;
    const totalEntries = library
      ? Object.values(library).reduce((a, b) => a + (b as number), 0)
      : 0;

    const completedTasks = tasksData?.completed?.length ?? 0;
    const totalCheckins = habitsData?.total_checkins ?? 0;
    const currentStreak = computeStreak(timelineData?.daily_counts ?? {});

    // Base XP
    let xp = 0;
    xp += totalEntries * 10;
    xp += completedTasks * 5;
    xp += totalCheckins * 3;
    xp += currentStreak * 20;

    // Badges
    const sectionCount = library
      ? Object.values(library).filter((v) => (v as number) > 0).length
      : 0;

    const badges = [
      {
        id: "first",
        label: "First Capture",
        desc: "Save your first entry",
        xpBonus: 50,
        unlocked: totalEntries >= 1,
      },
      {
        id: "collector",
        label: "Collector",
        desc: "10+ entries",
        xpBonus: 50,
        unlocked: totalEntries >= 10,
      },
      {
        id: "librarian",
        label: "Librarian",
        desc: "50+ entries",
        xpBonus: 50,
        unlocked: totalEntries >= 50,
      },
      {
        id: "diverse",
        label: "Explorer",
        desc: "3+ sections",
        xpBonus: 50,
        unlocked: sectionCount >= 3,
      },
      {
        id: "streaker",
        label: "Streaker",
        desc: "7-day streak",
        xpBonus: 50,
        unlocked: currentStreak >= 7,
      },
      {
        id: "master",
        label: "Master",
        desc: "100+ entries",
        xpBonus: 50,
        unlocked: totalEntries >= 100,
      },
    ];

    const unlockedCount = badges.filter((b) => b.unlocked).length;
    xp += unlockedCount * 50;

    // Determine level
    let level = 1;
    let nextThreshold = LEVEL_THRESHOLDS[1]?.minXp ?? 100;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i].minXp) {
        level = LEVEL_THRESHOLDS[i].level;
        nextThreshold = LEVEL_THRESHOLDS[i + 1]?.minXp ?? LEVEL_THRESHOLDS[i].minXp * 2;
        break;
      }
    }

    const currentThreshold = LEVEL_THRESHOLDS[level - 1]?.minXp ?? 0;
    const xpToNext = nextThreshold - xp;
    const progressPercent = Math.min(
      100,
      Math.round(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    );

    return {
      xp,
      level,
      xpToNext,
      progressPercent,
      totalEntries,
      currentStreak,
      badges,
      unlockedCount,
      totalCount: badges.length,
      loading,
    };
  }, [stats, tasksData, habitsData, timelineData, loading]);
}
