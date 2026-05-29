import { WidgetCard } from "@/components/ui/WidgetCard";
import { useGamification } from "@/hooks/useGamification";
import { Zap, BookOpen, Target, Flame, Trophy, Lock } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  first: <Zap size={16} />,
  collector: <BookOpen size={16} />,
  librarian: <BookOpen size={16} />,
  diverse: <Target size={16} />,
  streaker: <Flame size={16} />,
  master: <Trophy size={16} />,
};

export function GamificationBadges() {
  const { badges, unlockedCount, totalCount, loading } = useGamification();

  return (
    <WidgetCard
      title={`Achievements ${unlockedCount}/${totalCount}`}
      icon={<Trophy size={18} />}
      className="col-span-1 sm:col-span-2"
    >
      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {badges.map((b) => (
            <div
              key={b.id}
              title={b.desc}
              className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-all ${
                b.unlocked
                  ? "border-accent/30 bg-accent/5 text-accent"
                  : "border-border bg-card text-muted opacity-60"
              }`}
            >
              {b.unlocked ? iconMap[b.id] : <Lock size={14} />}
              <span className="text-[10px] font-medium text-center leading-tight">{b.label}</span>
            </div>
          ))}
        </div>
      )}
    </WidgetCard>
  );
}
