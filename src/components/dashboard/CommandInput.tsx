import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { sendCommand } from "@/lib/api";
import { Send } from "lucide-react";

export function CommandInput() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setOutput("Sending...");
    try {
      const data = await sendCommand(text.trim());
      setOutput(data.reply || data.status);
    } catch (e) {
      setOutput(`Error: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardTitle>Send Command</CardTitle>
      <div className="flex gap-2">
        <Input
          placeholder="Type a command..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={loading} className="gap-1">
          <Send size={16} />
          Send
        </Button>
      </div>
      {output && (
        <pre className="mt-4 rounded-lg border border-border bg-pre-bg p-4 text-sm whitespace-pre-wrap">
          {output}
        </pre>
      )}
    </Card>
  );
}
