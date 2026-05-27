import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useReminders } from "@/hooks/useApi";
import { formatDate } from "@/lib/utils";
import { Trash2 } from "lucide-react";

export function Reminders() {
  const { items, loading, createReminder, deleteReminder } = useReminders();
  const [message, setMessage] = useState("");
  const [runAt, setRunAt] = useState("");

  const handleCreate = async () => {
    if (!message || !runAt) return;
    await createReminder(message, runAt);
    setMessage("");
    setRunAt("");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Pending Reminders</CardTitle>
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-muted">No pending reminders.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="py-2 pr-4 text-left">When</th>
                  <th className="py-2 pr-4 text-left">Message</th>
                  <th className="py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="py-2 pr-4 text-muted">
                      {item.run_at ? formatDate(item.run_at) : "—"}
                    </td>
                    <td className="py-2 pr-4">{item.message}</td>
                    <td className="py-2 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          if (confirm("Remove this reminder?")) {
                            deleteReminder(item.id);
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Create Reminder</CardTitle>
        <div className="space-y-3">
          <Input
            placeholder="What to remind?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Input
            type="datetime-local"
            value={runAt}
            onChange={(e) => setRunAt(e.target.value)}
          />
          <Button onClick={handleCreate}>Create</Button>
        </div>
      </Card>
    </div>
  );
}
