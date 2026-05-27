import { Card, CardTitle } from "@/components/ui/Card";
import { useDashboardStats } from "@/hooks/useApi";
import { BookOpen, User, Hash, FileText, Lightbulb, Link2, RefreshCw } from "lucide-react";

const statIcons: Record<string, React.ReactNode> = {
  profile: <User size={20} />,
  terms: <Hash size={20} />,
  books: <BookOpen size={20} />,
  articles: <FileText size={20} />,
  thoughts: <Lightbulb size={20} />,
  references: <Link2 size={20} />,
};

export function Overview() {
  const { data, error, loading, refetch } = useDashboardStats();

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-danger bg-banner-error-bg px-4 py-3 text-banner-error-text">
          {error}
        </div>
      )}

      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Library</CardTitle>
          <button
            onClick={refetch}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-surface"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {data?.library &&
            Object.entries(data.library).map(([key, value]) => (
              <div
                key={key}
                className="flex flex-col items-center rounded-lg border border-border bg-surface p-4 text-center"
              >
                <div className="mb-2 text-accent">{statIcons[key]}</div>
                <div className="text-2xl font-bold text-accent">{value}</div>
                <div className="text-xs capitalize text-muted">{key}</div>
              </div>
            ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Integration Health</CardTitle>
        <div className="space-y-2">
          {data?.integrations &&
            Object.entries(data.integrations).map(([name, ok]) => (
              <div key={name} className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${ok ? "bg-success" : "bg-danger"}`}
                />
                <span className="text-sm capitalize">{name}</span>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
