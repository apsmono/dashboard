import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useCalendarData } from "@/hooks/useCalendarData";
import { CalendarGrid } from "./CalendarGrid";
import { Calendar, CheckCircle2, Circle, Flame, Bell, BookOpen, Loader2 } from "lucide-react";

const typeIcons: Record<string, React.ReactNode> = {
  task: <Circle size={12} />,
  habit: <Flame size={12} />,
  reminder: <Bell size={12} />,
  entry: <BookOpen size={12} />,
};

const typeLabels: Record<string, string> = {
  task: "Task",
  habit: "Habit",
  reminder: "Reminder",
  entry: "Entry",
};

export function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    new Date().toISOString().split("T")[0]
  );
  const { eventsByDate, loading } = useCalendarData();

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] ?? [] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text flex items-center gap-2">
          <Calendar size={20} className="text-accent" />
          Calendar
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Calendar grid */}
          <div className="lg:col-span-2">
            <Card className="p-4">
              <CalendarGrid
                currentMonth={currentMonth}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onSelectDate={setSelectedDate}
                selectedDate={selectedDate}
                eventsByDate={eventsByDate}
              />
            </Card>
          </div>

          {/* Day detail sidebar */}
          <div>
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-text">
                {selectedDate
                  ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })
                  : "Select a date"}
              </h3>

              {selectedEvents.length === 0 ? (
                <p className="text-sm text-muted py-4 text-center">No events</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2"
                    >
                      <span className="text-muted shrink-0">{typeIcons[event.type]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{event.title}</div>
                        <div className="flex items-center gap-1">
                          <Badge variant="default" className="text-[10px]">
                            {typeLabels[event.type]}
                          </Badge>
                          {event.time && (
                            <span className="text-[10px] text-muted">{event.time}</span>
                          )}
                        </div>
                      </div>
                      {event.status === "completed" && (
                        <CheckCircle2 size={14} className="text-success shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
