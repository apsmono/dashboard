import { Card, CardTitle } from "@/components/ui/Card";
import { useCommands } from "@/hooks/useApi";
import { formatDate } from "@/lib/utils";

export function Commands() {
  const { commands, loading } = useCommands();

  return (
    <Card>
      <CardTitle>Recent Commands</CardTitle>
      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : commands.length === 0 ? (
        <p className="text-muted">No commands yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="py-2 pr-4 text-left">Time</th>
                <th className="py-2 pr-4 text-left">Text</th>
                <th className="py-2 text-left">Intent</th>
              </tr>
            </thead>
            <tbody>
              {commands.map((cmd) => (
                <tr key={cmd.id} className="border-b border-border/50">
                  <td className="py-2 pr-4 text-muted">{formatDate(cmd.created_at)}</td>
                  <td className="py-2 pr-4">{cmd.text}</td>
                  <td className="py-2 text-muted">{cmd.intent || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
