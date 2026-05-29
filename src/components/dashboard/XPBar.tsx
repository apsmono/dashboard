import { WidgetCard } from "@/components/ui/WidgetCard";
import { useGamification } from "@/hooks/useGamification";
import { Star, TrendingUp } from "lucide-react";

export function XPBar() {
  const { xp, level, xpToNext, progressPercent, unlockedCount, totalCount, loading } = useGamification();

  const levelLabel = (lvl: number) => {
    const labels = [
      "Novice", "Explorer", "Collector", "Apprentice",
      "Scholar", "Adept", "Expert", "Sage", "Master", "Grandmaster",
    ];
    return labels[lvl - 1] ?? "Legend";
  };

  return (
    <WidgetCard title={`Level ${level} — ${levelLabel(level)}`} icon={<Star size={18} />} accent>
      {loading ? (
        <div className="space-y-2">
          <div className="h-4 rounded shimmer" />
          <div className="h-2 rounded shimmer" />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white text-sm font-bold">
                {level}
              </div>
              <div>
                <div className="text-sm font-medium text-text">{levelLabel(level)}</div>
                <div className="text-xs text-muted">{xp.toLocaleString()} XP total</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted">
              <TrendingUp size={12} />
              {unlockedCount}/{totalCount} badges
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="h-2 w-full rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted">
              <span>{progressPercent}% to next level</span>
              <span>{xpToNext.toLocaleString()} XP needed</span>
            </div>
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
