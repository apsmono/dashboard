import { useState } from "react";
import { Target, FolderKanban, Sparkles, Loader2, CheckCircle2, Circle, Pause, Lightbulb, Trophy, AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useGoals, useProjects, useFocusSuggestions } from "@/hooks/useApi";
import { generateWeeklyReview } from "@/lib/api";

interface ReviewData {
  status: string;
  review: string;
  wins: string[];
  gaps: string[];
  next_focus: string;
  recent_count: number;
}

export function PlanningPage() {
  const { data: goalsData, loading: goalsLoading } = useGoals();
  const { data: projectsData, loading: projectsLoading } = useProjects();
  const { data: focusData, loading: focusLoading } = useFocusSuggestions();
  const [review, setReview] = useState<ReviewData | null>(null);
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

  const loading = goalsLoading || projectsLoading || focusLoading;

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

      {/* Goals */}
      <Card>
        <CardTitle className="flex items-center gap-2">
          <Target size={16} className="text-accent" />
          Goals
        </CardTitle>
        <div className="space-y-2">
          {goalsData?.active.map((g) => (
            <div key={g.id} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
              <Circle size={14} className="text-success" />
              <span className="text-sm">{g.title}</span>
              <Badge variant="success" className="ml-auto text-[10px]">
                active
              </Badge>
            </div>
          ))}
          {goalsData?.paused.map((g) => (
            <div key={g.id} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 opacity-60">
              <Pause size={14} className="text-muted" />
              <span className="text-sm">{g.title}</span>
              <Badge variant="default" className="ml-auto text-[10px]">
                {g.status}
              </Badge>
            </div>
          ))}
          {goalsData?.completed.map((g) => (
            <div key={g.id} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 opacity-50">
              <CheckCircle2 size={14} className="text-muted" />
              <span className="text-sm line-through">{g.title}</span>
              <Badge variant="default" className="ml-auto text-[10px]">
                done
              </Badge>
            </div>
          ))}
          {(!goalsData || goalsData.goals.length === 0) && (
            <p className="text-sm text-muted">No goals yet.</p>
          )}
        </div>
      </Card>

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
