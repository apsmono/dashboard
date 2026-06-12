import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowUpRight, History } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { Project, ProjectStatus } from "@/types";
import { repoFromUrl, useRepoActivity } from "@/hooks/useRepoActivity";

interface ProjectsProps {
  projects: Project[];
}

const STATUS_META: Record<ProjectStatus, { label: string; variant: "default" | "success" | "accent" }> = {
  shipped: { label: "Shipped", variant: "success" },
  active: { label: "Active", variant: "accent" },
  wip: { label: "WIP", variant: "default" },
};

/** Coarse relative time for "last push" — keeps it honest without ticking clocks. */
function relativePush(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }
  const years = Math.floor(days / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

export function Projects({ projects }: ProjectsProps) {
  const activity = useRepoActivity(projects.map((p) => repoFromUrl(p.sourceUrl)));
  return (
    <section id="projects" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-2 text-center text-3xl font-bold">Projects</h2>
        <p className="mb-12 text-center text-muted">Things I've built.</p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const Icon = ((LucideIcons as unknown) as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[project.icon] || LucideIcons.Circle;
            const repo = repoFromUrl(project.sourceUrl);
            const pushedAt = repo ? activity[repo] : undefined;
            return (
              <Card
                key={project.name}
                className="group flex flex-col transition-transform hover:-translate-y-1 hover:border-accent"
              >
                <div className="mb-4 flex h-36 items-center justify-center rounded-lg bg-gradient-to-br from-surface to-card">
                  <Icon size={48} className="text-accent/80" />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{project.name}</CardTitle>
                  {project.status && (
                    <Badge variant={STATUS_META[project.status].variant}>
                      {STATUS_META[project.status].label}
                    </Badge>
                  )}
                </div>
                {pushedAt && (
                  <p className="mb-2 flex items-center gap-1 text-xs text-muted" title={pushedAt}>
                    <History size={12} /> Last push {relativePush(pushedAt)}
                  </p>
                )}
                <p className="mb-4 flex-1 text-sm text-muted">{project.description}</p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="accent">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-4 text-sm font-medium">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-accent hover:underline"
                    >
                      Live Demo <ArrowUpRight size={14} />
                    </a>
                  )}
                  <a
                    href={project.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-accent hover:underline"
                  >
                    Source Code <ArrowUpRight size={14} />
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
