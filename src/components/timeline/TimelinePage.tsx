import { useState } from "react";
import { Clock, Calendar, Loader2, Filter } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useTimeline } from "@/hooks/useApi";
import type { TimelineDay } from "@/lib/api";

function MonthGroup({ month, days }: { month: string; days: TimelineDay[] }) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
        {month}
      </h3>
      <div className="space-y-2">
        {days.map((day) => (
          <Card key={day.date} className="py-3">
            <div className="mb-2 flex items-center gap-2 text-xs text-muted">
              <Calendar size={12} />
              {day.date}
              <Badge variant="accent">{day.entries.length} captures</Badge>
            </div>
            <div className="space-y-1">
              {day.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-surface transition-colors"
                >
                  <span className="text-xs text-muted">
                    <Clock size={10} />
                  </span>
                  <span className="truncate">{entry.title}</span>
                  <Badge variant="default" className="ml-auto shrink-0 text-[10px]">
                    {entry.section}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function TimelinePage() {
  const [section, setSection] = useState("");
  const { data, loading } = useTimeline({ section: section || undefined });

  const days = data?.days ?? [];

  // Group days by month
  const monthGroups: Record<string, TimelineDay[]> = {};
  days.forEach((day) => {
    const month = day.date.slice(0, 7); // YYYY-MM
    if (!monthGroups[month]) monthGroups[month] = [];
    monthGroups[month].push(day);
  });

  const sortedMonths = Object.keys(monthGroups).sort().reverse();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-muted" />
        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-text"
        >
          <option value="">All sections</option>
          <option value="profile">Profile</option>
          <option value="term">Terms</option>
          <option value="book">Books</option>
          <option value="article">Articles</option>
          <option value="thought">Thoughts</option>
          <option value="reference">References</option>
          <option value="research">Research</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : days.length === 0 ? (
        <Card className="py-12 text-center">
          <Calendar size={32} className="mx-auto mb-3 text-muted opacity-40" />
          <p className="text-muted">No timeline events found.</p>
        </Card>
      ) : (
        <div className="relative border-l-2 border-border pl-4">
          {sortedMonths.map((month) => (
            <MonthGroup key={month} month={month} days={monthGroups[month]} />
          ))}
        </div>
      )}
    </div>
  );
}
