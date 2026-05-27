import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, GitBranch, Filter } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useGraphData } from "@/hooks/useApi";

interface NodePos {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  label: string;
  section: string;
  color: string;
  size: number;
}

const WIDTH = 800;
const HEIGHT = 500;

function runForceLayout(
  nodes: NodePos[],
  edges: { source: string; target: string; weight: number }[],
  iterations = 100
) {
  const centerX = WIDTH / 2;
  const centerY = HEIGHT / 2;

  for (let i = 0; i < iterations; i++) {
    // Repulsion
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        const dx = nodes[b].x - nodes[a].x;
        const dy = nodes[b].y - nodes[a].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 2000 / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        nodes[a].vx -= fx;
        nodes[a].vy -= fy;
        nodes[b].vx += fx;
        nodes[b].vy += fy;
      }
    }

    // Attraction (edges)
    for (const edge of edges) {
      const a = nodes.find((n) => n.id === edge.source);
      const b = nodes.find((n) => n.id === edge.target);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist * 0.001) * edge.weight;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    // Center gravity
    for (const n of nodes) {
      n.vx += (centerX - n.x) * 0.0005;
      n.vy += (centerY - n.y) * 0.0005;
    }

    // Apply velocity + damping
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      n.vx *= 0.5;
      n.vy *= 0.5;

      // Boundary
      n.x = Math.max(20, Math.min(WIDTH - 20, n.x));
      n.y = Math.max(20, Math.min(HEIGHT - 20, n.y));
    }
  }
}

export function GraphPage() {
  const { data, loading } = useGraphData(100);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedSection, setSelectedSection] = useState("");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<NodePos[]>([]);

  const sections = Array.from(new Set(data?.nodes.map((n) => n.section) ?? []));

  const initLayout = useCallback(() => {
    if (!data) return;
    const nodes: NodePos[] = data.nodes.map((n, i) => ({
      id: n.id,
      x: WIDTH / 2 + Math.cos((i / data.nodes.length) * Math.PI * 2) * 150,
      y: HEIGHT / 2 + Math.sin((i / data.nodes.length) * Math.PI * 2) * 150,
      vx: 0,
      vy: 0,
      label: n.label,
      section: n.section,
      color: n.color,
      size: n.size,
    }));
    runForceLayout(nodes, data.edges);
    setNodePositions(nodes);
  }, [data]);

  useEffect(() => {
    initLayout();
  }, [initLayout]);

  const visibleNodes = selectedSection
    ? nodePositions.filter((n) => n.section === selectedSection)
    : nodePositions;

  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges =
    data?.edges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <GitBranch size={16} className="text-accent" />
        <span className="text-sm font-medium">Knowledge Graph</span>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <Filter size={12} className="text-muted" />
          <button
            onClick={() => setSelectedSection("")}
            className={`rounded-md px-2 py-0.5 text-xs ${
              selectedSection === "" ? "bg-accent text-white" : "bg-surface text-muted"
            }`}
          >
            All
          </button>
          {sections.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSection(s)}
              className={`rounded-md px-2 py-0.5 text-xs capitalize ${
                selectedSection === s ? "bg-accent text-white" : "bg-surface text-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full h-auto bg-bg"
            style={{ maxHeight: 500 }}
          >
            {/* Edges */}
            {visibleEdges.map((e, i) => {
              const a = visibleNodes.find((n) => n.id === e.source);
              const b = visibleNodes.find((n) => n.id === e.target);
              if (!a || !b) return null;
              return (
                <line
                  key={`edge-${i}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={e.type === "shared_tag" ? "#38bdf8" : "#334155"}
                  strokeWidth={e.type === "shared_tag" ? 1.5 : 0.5}
                  strokeOpacity={0.4}
                />
              );
            })}

            {/* Nodes */}
            {visibleNodes.map((n) => (
              <g
                key={n.id}
                transform={`translate(${n.x}, ${n.y})`}
                onMouseEnter={() => setHoveredNode(n.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  r={n.size}
                  fill={n.color}
                  stroke={hoveredNode === n.id ? "#fff" : "transparent"}
                  strokeWidth={2}
                  opacity={0.9}
                />
                {hoveredNode === n.id && (
                  <>
                    <rect
                      x={-(n.label.length * 3 + 8)}
                      y={-n.size - 22}
                      width={n.label.length * 6 + 16}
                      height={18}
                      rx={4}
                      fill="#1e2330"
                      stroke="#334155"
                      strokeWidth={1}
                    />
                    <text
                      y={-n.size - 10}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize={10}
                    >
                      {n.label.length > 30 ? n.label.slice(0, 30) + "..." : n.label}
                    </text>
                  </>
                )}
              </g>
            ))}
          </svg>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 text-xs text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[#38bdf8]" />
          Shared tag
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[#334155]" />
          Same section
        </span>
        <span>{data?.nodes.length ?? 0} nodes · {data?.edges.length ?? 0} edges</span>
      </div>
    </div>
  );
}
