import { useState } from "react";
import { Target, FolderKanban, Sparkles, Loader2, CheckCircle2, Circle, Pause, Lightbulb, Trophy, AlertCircle, ArrowRight, ListTodo, Plus, Trash2, Calendar, Flame, Check, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useGoals, useProjects, useFocusSuggestions, useTasks, useHabits } from "@/hooks/useApi";
import { generateWeeklyReview } from "@/lib/api";

interface ReviewData {
  status: string;
  review: string;
  wins: string[];
  gaps: string[];
  next_focus: string;
  recent_count: number;
}

interface GoalNode {
  id: string;
  title: string;
  status: string;
  progress: number;
  parent_id: string | null;
  children?: GoalNode[];
}

function GoalTreeCard({
  goalsData,
  updateGoal,
}: {
  goalsData: { tree: GoalNode[]; goals: GoalNode[] } | null;
  updateGoal: (id: string, payload: { status?: string; progress?: number }) => Promise<unknown>;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 size={14} className="text-muted shrink-0" />;
      case "paused": return <Pause size={14} className="text-muted shrink-0" />;
      default: return <Circle size={14} className="text-success shrink-0" />;
    }
  };

  const progressColor = (progress: number) => {
    if (progress >= 80) return "bg-success";
    if (progress >= 50) return "bg-accent";
    if (progress >= 20) return "bg-warning";
    return "bg-danger";
  };

  const renderNode = (node: GoalNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded.has(node.id);

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 rounded-lg bg-surface px-3 py-2 ${node.status === "completed" ? "opacity-50" : ""} ${depth > 0 ? "ml-4 border-l border-border" : ""}`}
        >
          {hasChildren && (
            <button
              onClick={() => toggleExpand(node.id)}
              className="shrink-0 text-muted hover:text-text transition-colors"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
          {!hasChildren && <span className="w-[14px] shrink-0" />}
          {statusIcon(node.status)}
          <span className={`flex-1 text-sm ${node.status === "completed" ? "line-through" : ""}`}>
            {node.title}
          </span>
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progressColor(node.progress)}`}
                style={{ width: `${node.progress}%` }}
              />
            </div>
            <span className="text-[10px] text-muted w-6 text-right">{node.progress}%</span>
          </div>
          <button
            onClick={() => {
              const nextStatus = node.status === "active" ? "completed" : "active";
              updateGoal(node.id, { status: nextStatus, progress: nextStatus === "completed" ? 100 : 0 });
            }}
            className="text-[10px] text-muted hover:text-text transition-colors"
            title="Toggle status"
          >
            {node.status === "completed" ? "Reopen" : "Done"}
          </button>
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        <Target size={16} className="text-accent" />
        Goals
        {goalsData?.goals && goalsData.goals.length > 0 && (
          <Badge variant="accent" className="text-[10px]">
            {goalsData.goals.length} total
          </Badge>
        )}
      </CardTitle>
      <div className="space-y-1">
        {goalsData?.tree && goalsData.tree.length > 0 ? (
          goalsData.tree.map((root) => renderNode(root))
        ) : goalsData?.goals && goalsData.goals.length > 0 ? (
          // Fallback: flat list if tree is empty but goals exist
          goalsData.goals.map((g) => renderNode(g))
        ) : (
          <p className="text-sm text-muted">No goals yet.</p>
        )}
      </div>
    </Card>
  );
}

export function PlanningPage() {
  const { data: goalsData, loading: goalsLoading, update: updateGoal } = useGoals();
  const { data: projectsData, loading: projectsLoading } = useProjects();
  const { data: focusData, loading: focusLoading } = useFocusSuggestions();
  const { data: tasksData, loading: tasksLoading, create: createTask, update: updateTask, remove: deleteTask } = useTasks();
  const { data: habitsData, loading: habitsLoading, create: createHabit, checkin, uncheckin, remove: deleteHabit } = useHabits();
  const [review, setReview] = useState<ReviewData | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [newHabitText, setNewHabitText] = useState("");
  const [addingHabit, setAddingHabit] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  const handleGenerateReview = async () => {
    setReviewLoading(true);
    try {
      const res = await generateWeeklyReview();
      setReview(res);
    } catch (e) {
      setReview(null);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;
    setAddingTask(true);
    try {
      await createTask({ title: newTaskText.trim(), priority: "medium" });
      setNewTaskText("");
    } finally {
      setAddingTask(false);
    }
  };

  const toggleTask = async (taskId: string, currentStatus: string) => {
    await updateTask(taskId, { status: currentStatus === "active" ? "completed" : "active" });
  };

  const handleAddHabit = async () => {
    if (!newHabitText.trim()) return;
    setAddingHabit(true);
    try {
      await createHabit({ name: newHabitText.trim() });
      setNewHabitText("");
    } finally {
      setAddingHabit(false);
    }
  };

  const toggleHabitCheckin = async (habitId: string, checkedToday: boolean) => {
    if (checkedToday) {
      await uncheckin(habitId);
    } else {
      await checkin(habitId);
    }
  };

  const loading = goalsLoading || projectsLoading || focusLoading || tasksLoading || habitsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Focus suggestions */}
      {focusData && (
        <Card className="border-accent/30">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb size={16} className="text-accent" />
            Focus
          </CardTitle>
          <div className="space-y-1">
            {focusData.suggestions.map((s, i) => (
              <p key={i} className="text-sm text-text">
                {s}
              </p>
            ))}
          </div>
          {focusData.active_goals.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {focusData.active_goals.map((g) => (
                <Badge key={g} variant="accent">
                  {g}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tasks */}
      <Card>
        <CardTitle className="flex items-center gap-2">
          <ListTodo size={16} className="text-accent" />
          Tasks
          {tasksData?.active && tasksData.active.length > 0 && (
            <Badge variant="accent" className="text-[10px]">
              {tasksData.active.length} active
            </Badge>
          )}
        </CardTitle>
        {/* Add task */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddTask(); }}
            placeholder="Add a new task..."
            className="flex-1 rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
          <button
            onClick={handleAddTask}
            disabled={addingTask || !newTaskText.trim()}
            className="flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {addingTask ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add
          </button>
        </div>

        {tasksLoading ? (
          <div className="space-y-2">
            <div className="h-8 rounded shimmer" />
            <div className="h-8 rounded shimmer" />
          </div>
        ) : tasksData?.active.length === 0 && tasksData?.completed.length === 0 ? (
          <p className="text-sm text-muted">No tasks yet. Add one above!</p>
        ) : (
          <div className="space-y-3">
            {/* Active tasks */}
            {tasksData?.active && tasksData.active.length > 0 && (
              <div className="space-y-1.5">
                {tasksData.active.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 group">
                    <button
                      onClick={() => toggleTask(task.id, task.status)}
                      className="shrink-0 text-muted hover:text-success transition-colors"
                    >
                      <Circle size={16} />
                    </button>
                    <span className="flex-1 text-sm">{task.title}</span>
                    {task.priority === "high" && <Badge variant="danger" className="text-[10px]">High</Badge>}
                    {task.due_date && (
                      <span className="text-[10px] text-muted flex items-center gap-0.5">
                        <Calendar size={10} />
                        {task.due_date}
                      </span>
                    )}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* Completed tasks */}
            {tasksData?.completed && tasksData.completed.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-medium text-muted">
                  Completed ({tasksData.completed.length})
                </div>
                <div className="space-y-1">
                  {tasksData.completed.slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5 opacity-50">
                      <CheckCircle2 size={14} className="text-success shrink-0" />
                      <span className="flex-1 text-sm line-through">{task.title}</span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-muted hover:text-danger transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {tasksData.completed.length > 3 && (
                    <p className="text-xs text-muted pl-2">+{tasksData.completed.length - 3} more</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Habits */}
      <Card>
        <CardTitle className="flex items-center gap-2">
          <Flame size={16} className="text-accent" />
          Habits
          {habitsData?.habits && habitsData.habits.length > 0 && (
            <Badge variant="accent" className="text-[10px]">
              {habitsData.total_checkins} check-ins
            </Badge>
          )}
        </CardTitle>
        {/* Add habit */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newHabitText}
            onChange={(e) => setNewHabitText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddHabit(); }}
            placeholder="Track a new habit..."
            className="flex-1 rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
          <button
            onClick={handleAddHabit}
            disabled={addingHabit || !newHabitText.trim()}
            className="flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {addingHabit ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add
          </button>
        </div>

        {habitsLoading ? (
          <div className="space-y-2">
            <div className="h-8 rounded shimmer" />
            <div className="h-8 rounded shimmer" />
          </div>
        ) : habitsData?.habits.length === 0 ? (
          <p className="text-sm text-muted">No habits tracked yet. Add one above!</p>
        ) : (
          <div className="space-y-3">
            {habitsData?.habits.map((habit) => (
              <div key={habit.id} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 group">
                <button
                  onClick={() => toggleHabitCheckin(habit.id, habit.checked_today)}
                  className={`shrink-0 transition-colors ${habit.checked_today ? "text-success" : "text-muted hover:text-success"}`}
                  title={habit.checked_today ? "Checked in today" : "Check in"}
                >
                  {habit.checked_today ? <Check size={16} /> : <Circle size={16} />}
                </button>
                <span className="flex-1 text-sm">{habit.name}</span>
                <span className={`text-xs font-medium ${habit.streak >= 7 ? "text-warning" : habit.streak >= 21 ? "text-accent" : "text-muted"}`}>
                  {habit.streak}
                  <Flame size={10} className="inline ml-0.5" />
                </span>
                <button
                  onClick={() => deleteHabit(habit.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Goals */}
      <GoalTreeCard goalsData={goalsData} updateGoal={updateGoal} />

      {/* Projects */}
      <Card>
        <CardTitle className="flex items-center gap-2">
          <FolderKanban size={16} className="text-accent" />
          Projects
        </CardTitle>
        <div className="space-y-2">
          {projectsData?.active.map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
              <Circle size={14} className="text-success" />
              <span className="text-sm">{p.title}</span>
              <Badge variant="success" className="ml-auto text-[10px]">
                active
              </Badge>
            </div>
          ))}
          {projectsData?.completed.map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 opacity-50">
              <CheckCircle2 size={14} className="text-muted" />
              <span className="text-sm line-through">{p.title}</span>
              <Badge variant="default" className="ml-auto text-[10px]">
                done
              </Badge>
            </div>
          ))}
          {(!projectsData || projectsData.projects.length === 0) && (
            <p className="text-sm text-muted">No projects yet.</p>
          )}
        </div>
      </Card>

      {/* Weekly review */}
      <Card>
        <CardTitle className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          Weekly Review
        </CardTitle>
        <Button onClick={handleGenerateReview} disabled={reviewLoading} size="sm">
          {reviewLoading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
          Generate Review
        </Button>
        {review && (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-border bg-surface p-3">
              <div className="mb-2 text-xs font-medium text-muted">Summary</div>
              <p className="text-sm text-text">{review.review}</p>
            </div>

            {review.wins.length > 0 && (
              <div>
                <div className="mb-1 flex items-center gap-1 text-xs font-medium text-success">
                  <Trophy size={12} />
                  Wins
                </div>
                <div className="space-y-1">
                  {review.wins.map((w, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-text">
                      <CheckCircle2 size={12} className="text-success" />
                      {w}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {review.gaps.length > 0 && (
              <div>
                <div className="mb-1 flex items-center gap-1 text-xs font-medium text-warning">
                  <AlertCircle size={12} />
                  Gaps
                </div>
                <div className="space-y-1">
                  {review.gaps.map((g, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-text">
                      <ArrowRight size={12} className="text-warning" />
                      {g}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {review.next_focus && (
              <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                <div className="mb-1 text-xs font-medium text-accent">Next Focus</div>
                <p className="text-sm text-text">{review.next_focus}</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
