import { Card } from "@/components/ui/Card";
import { Construction } from "lucide-react";

interface PlaceholderProps {
  title: string;
  phase: string;
}

export function Placeholder({ title, phase }: PlaceholderProps) {
  return (
    <Card className="py-12 text-center">
      <Construction size={48} className="mx-auto mb-4 text-muted opacity-50" />
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-muted">{phase}</p>
    </Card>
  );
}
