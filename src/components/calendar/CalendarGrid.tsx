import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarEvent } from "@/hooks/useCalendarData";

interface CalendarGridProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: string) => void;
  selectedDate: string | null;
  eventsByDate: Record<string, CalendarEvent[]>;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonthGrid(month: Date): { date: Date; dateStr: string; isCurrentMonth: boolean }[] {
  const year = month.getFullYear();
  const monthIdx = month.getMonth();

  const firstDay = new Date(year, monthIdx, 1);
  const lastDay = new Date(year, monthIdx + 1, 0);

  // Adjust so Monday = 0, Sunday = 6
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];

  // Previous month padding
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, monthIdx, -i);
    days.push({ date: d, dateStr: d.toISOString().split("T")[0], isCurrentMonth: false });
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, monthIdx, d);
    days.push({ date, dateStr: date.toISOString().split("T")[0], isCurrentMonth: true });
  }

  // Next month padding to fill 6 rows (42 cells)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, monthIdx + 1, i);
    days.push({ date: d, dateStr: d.toISOString().split("T")[0], isCurrentMonth: false });
  }

  return days;
}

export function CalendarGrid({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  selectedDate,
  eventsByDate,
}: CalendarGridProps) {
  const days = useMemo(() => getMonthGrid(currentMonth), [currentMonth]);
  const monthLabel = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrevMonth}
          className="rounded-lg border border-border bg-card p-2 text-muted hover:text-text transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <h2 className="text-lg font-semibold text-text">{monthLabel}</h2>
        <button
          onClick={onNextMonth}
          className="rounded-lg border border-border bg-card p-2 text-muted hover:text-text transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(({ dateStr, isCurrentMonth }) => {
          const events = eventsByDate[dateStr] ?? [];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          // Show max 3 dot colors, deduplicated
          const dotColors = [...new Set(events.slice(0, 3).map((e) => e.color))];

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-all min-h-[3.5rem] ${
                isSelected
                  ? "border-accent bg-accent/10"
                  : isToday
                    ? "border-accent/50 bg-accent/5"
                    : "border-border bg-card hover:border-accent/30"
              } ${!isCurrentMonth ? "opacity-40" : ""}`}
            >
              <span
                className={`text-sm font-medium ${
                  isToday ? "text-accent" : isCurrentMonth ? "text-text" : "text-muted"
                }`}
              >
                {parseInt(dateStr.split("-")[2], 10)}
              </span>
              <div className="flex gap-0.5">
                {dotColors.map((color, i) => (
                  <div key={i} className={`h-1.5 w-1.5 rounded-full ${color}`} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
