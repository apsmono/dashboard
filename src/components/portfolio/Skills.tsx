import { Card } from "@/components/ui/Card";
import * as LucideIcons from "lucide-react";
import type { Skill } from "@/types";

interface SkillsProps {
  skills: Skill[];
}

export function Skills({ skills }: SkillsProps) {
  return (
    <section id="skills" className="px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-2 text-center text-3xl font-bold">Skills</h2>
        <p className="mb-12 text-center text-muted">Tools and technologies I work with.</p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {skills.map((skill) => {
            const Icon = ((LucideIcons as unknown) as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[skill.icon] || LucideIcons.Circle;
            return (
              <Card
                key={skill.name}
                className="flex flex-col items-center justify-center gap-2 py-5 text-center transition-colors hover:border-accent"
              >
                <Icon size={24} className="text-accent" />
                <span className="text-sm font-semibold">{skill.name}</span>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
