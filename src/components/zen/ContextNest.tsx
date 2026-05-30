import { useEffect, useMemo, useState } from "react";
import { fetchLibraryRecent } from "@/lib/api";
import { StreamCard } from "./StreamCard";
import type { StreamCardData } from "./types";

const PLACEHOLDER_CARDS: StreamCardData[] = [
  {
    id: "demo-email",
    source: "Gmail",
    timeLabel: "2h ago",
    kind: "email",
    bullets: [
      "Client asked about contract timeline for Q3 deliverables.",
      "They prefer a friendly tone and mention Thursday availability.",
      "No attachments — quick reply is enough.",
    ],
  },
  {
    id: "demo-news",
    source: "Tech digest",
    timeLabel: "4h ago",
    kind: "news",
    bullets: [
      "Vector databases are consolidating around pgvector for small teams.",
      "Personal AI assistants trend toward calm, single-pane workspaces.",
      "Human-in-the-loop remains the default for outbound actions.",
    ],
  },
];

function entryToCard(entry: {
  id: string;
  title?: string;
  section?: string;
  tags?: string[];
  updated_at?: string;
}): StreamCardData {
  const title = entry.title ?? "Untitled capture";
  const section = entry.section ?? "library";
  const tagLine = entry.tags?.length ? `Tags: ${entry.tags.slice(0, 3).join(", ")}` : "Recently captured in your library.";
  return {
    id: entry.id,
    source: section.charAt(0).toUpperCase() + section.slice(1),
    timeLabel: entry.updated_at ? new Date(entry.updated_at).toLocaleDateString() : "Recent",
    kind: "library",
    bullets: [title, tagLine, "Open in Knowledge Library to read or ask AI about this entry."],
  };
}

interface ContextNestProps {
  selectedCardId: string | null;
  onSelectCard: (id: string | null) => void;
  onCardAction?: (cardId: string, actionId: string) => void;
}

export function ContextNest({ selectedCardId, onSelectCard, onCardAction }: ContextNestProps) {
  const [libraryCards, setLibraryCards] = useState<StreamCardData[]>([]);

  useEffect(() => {
    fetchLibraryRecent(4)
      .then((res) => {
        const cards = (res.entries ?? []).slice(0, 4).map(entryToCard);
        setLibraryCards(cards);
      })
      .catch(() => setLibraryCards([]));
  }, []);

  const cards = useMemo(() => {
    if (libraryCards.length >= 2) return libraryCards.slice(0, 6);
    return [...libraryCards, ...PLACEHOLDER_CARDS].slice(0, 6);
  }, [libraryCards]);

  return (
    <section aria-label="Context Nest">
      <header className="mb-3">
        <h2 className="text-base font-semibold text-text">Context Nest</h2>
        <p className="text-sm text-muted">Compressed streams — three bullets each, no noise.</p>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <StreamCard
            key={card.id}
            card={card}
            selected={selectedCardId === card.id}
            onSelect={() => onSelectCard(selectedCardId === card.id ? null : card.id)}
            onAction={(actionId) => onCardAction?.(card.id, actionId)}
          />
        ))}
      </div>
    </section>
  );
}
