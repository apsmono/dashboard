import { CheckCircle2, Circle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTasks } from "@/hooks/useApi";

const MAX_FOCUS = 5;

interface CriticalFocusBlockProps {
  onContextAction?: (actionId: string, taskId?: string) => void;
}

export function CriticalFocusBlock({ onContextAction }: CriticalFocusBlockProps) {
  const { data, loading, update } = useTasks({ status: "active" });
  const tasks = (data?.active ?? []).slice(0, MAX_FOCUS);

  if (loading) {
    return (
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-muted">
          <Loader2 size={18} className="animate-spin" />
          Loading focus items…
        </div>
      </section>
    );
  }

  if (tasks.length === 0) {
    return (
      <section className="rounded-xl border-t-2 border-accent bg-card p-8 text-center shadow-sm">
        <CheckCircle2 size={40} className="mx-auto mb-3 text-success opacity-80" />
        <h2 className="text-lg font-semibold text-text">You are entirely caught up.</h2>
        <p className="mt-2 text-sm text-muted">
          Nothing needs your attention right now. Relax — Signal will surface what matters when it
          arrives.
        </p>
        <Sparkles size={20} className="mx-auto mt-4 text-accent/50" aria-hidden />
      </section>
    );
  }

  return (
    <section className="rounded-xl border-t-2 border-accent bg-card p-5 shadow-sm">
      <header className="mb-4 flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-text">Critical Focus</h2>
        <span className="text-xs text-muted">
          {tasks.length} of {MAX_FOCUS}
        </span>
      </header>
      <ol className="space-y-4">
        {tasks.map((task, index) => (
          <li key={task.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text">{task.title}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {task.due_date ? `Due: ${task.due_date}` : "No due date"}
                  {task.priority ? ` • Priority: ${task.priority}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onContextAction?.("complete-task", task.id)}
                  >
                    Mark done
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => update(task.id, { status: "completed" })}
                  >
                    <Circle size={14} className="mr-1" />
                    Complete
                  </Button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
