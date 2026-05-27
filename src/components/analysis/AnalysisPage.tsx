import { useState } from "react";
import { Tag, AlertTriangle, TrendingUp, Loader2, Search, Zap } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTagsAnalysis, useGapsAnalysis, useActivityAnalysis } from "@/hooks/useApi";
import { synthesizeAnalysis } from "@/lib/api";

export function AnalysisPage() {
  const { data: tagsData, loading: tagsLoading } = useTagsAnalysis();
  const { data: gapsData, loading: gapsLoading } = useGapsAnalysis();
  const { data: activityData, loading: activityLoading } = useActivityAnalysis();
  const [query, setQuery] = useState("");
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [synthSources, setSynthSources] = useState<string[]>([]);
  const [synthLoading, setSynthLoading] = useState(false);

  const handleSynthesize = async () => {
    if (!query.trim()) return;
    setSynthLoading(true);
    try {
      const res = await synthesizeAnalysis(query.trim());
      setSynthesis(res.synthesis || res.reply || "No synthesis returned.");
      setSynthSources(res.sources ?? []);
    } catch (e) {
      setSynthesis("Synthesis failed.");
      setSynthSources([]);
    } finally {
      setSynthLoading(false);
    }
  };

  const loading = tagsLoading || gapsLoading || activityLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  const tagEntries = tagsData?.frequencies ? Object.entries(tagsData.frequencies).sort((a, b) => b[1] - a[1]) : [];
  const maxFreq = tagEntries[0]?.[1] ?? 1;

  return (
    <div className="space-y-6">
      {/* Activity stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="text-center">
          <div className="text-2xl font-bold text-accent">{activityData?.total_entries ?? 0}</div>
          <div className="text-xs text-muted">Total Entries</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-success">{activityData?.capture_velocity ?? "—"}</div>
          <div className="text-xs text-muted">Capture Velocity</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-warning">{tagsData?.trending.length ?? 0}</div>
          <div className="text-xs text-muted">Trending Tags</div>
        </Card>
      </div>

      {/* Tag cloud */}
      <Card>
        <CardTitle className="flex items-center gap-2">
          <Tag size={16} className="text-accent" />
          Tag Cloud
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          {tagEntries.slice(0, 30).map(([tag, count]) => {
            const size = Math.max(0.75, Math.min(1.5, count / maxFreq + 0.5));
            return (
              <span
                key={tag}
                className="inline-flex items-center rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-text transition-colors hover:bg-accent/10 hover:text-accent"
                style={{ fontSize: `${size}rem` }}
              >
                {tag} ({count})
              </span>
            );
          })}
        </div>
      </Card>

      {/* Trending */}
      {tagsData?.trending && tagsData.trending.length > 0 && (
        <Card>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={16} className="text-success" />
            Trending (last 30 days)
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            {tagsData.trending.map((tag) => (
              <Badge key={tag} variant="success">
                {tag}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Gaps */}
      <Card>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-warning" />
          Gaps
        </CardTitle>
        <div className="space-y-3">
          {gapsData?.empty_sections && gapsData.empty_sections.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-medium text-muted">Empty Sections</div>
              <div className="flex flex-wrap gap-1">
                {gapsData.empty_sections.map((s) => (
                  <Badge key={s} variant="danger">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {gapsData?.stale_entries && gapsData.stale_entries.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-medium text-muted">
                Stale Entries ({gapsData.stale_entries.length})
              </div>
              <div className="space-y-1">
                {gapsData.stale_entries.slice(0, 5).map((e) => (
                  <div key={e.id} className="text-sm text-muted">
                    {e.title} <span className="text-xs">({e.days_since_update} days old)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {gapsData?.orphan_entries && gapsData.orphan_entries.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-medium text-muted">
                Untagged Entries ({gapsData.orphan_entries.length})
              </div>
              <div className="space-y-1">
                {gapsData.orphan_entries.slice(0, 5).map((e) => (
                  <div key={e.id} className="text-sm text-muted">
                    {e.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Synthesis */}
      <Card>
        <CardTitle className="flex items-center gap-2">
          <Zap size={16} className="text-accent" />
          AI Synthesis
        </CardTitle>
        <div className="flex gap-2">
          <Input
            placeholder="Ask about your knowledge..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSynthesize()}
          />
          <Button onClick={handleSynthesize} disabled={synthLoading}>
            {synthLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          </Button>
        </div>
        {synthesis && (
          <div className="mt-3 rounded-lg border border-border bg-surface p-3 text-sm text-text whitespace-pre-wrap">
            {synthesis}
          </div>
        )}
        {synthSources.length > 0 && (
          <div className="mt-2">
            <div className="mb-1 text-xs font-medium text-muted">Sources</div>
            <div className="flex flex-wrap gap-1">
              {synthSources.map((s) => (
                <Badge key={s} variant="default">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
