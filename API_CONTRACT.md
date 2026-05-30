# Dashboard ↔ Brain API Contract

> This document specifies every REST endpoint the TSX dashboard consumes from the `solo-leveling` brain. Frontend agents should treat this as the source of truth.

**Base URL:** `import.meta.env.VITE_API_BASE` (local: `http://localhost:8000`, prod: MacMini domain)

**Auth:** Firebase ID token as `Authorization: Bearer <token>` header on all `/api/v1/*` endpoints. Public endpoints (`/healthz`, `/command`) require no auth.

---

## Endpoints Summary

| Method | Path | Purpose | Dashboard View |
|--------|------|---------|----------------|
| GET | `/healthz` | Server health | — |
| POST | `/command` | Send text command | Send Command |
| GET | `/api/v1/dashboard/stats` | Library counts + integration health | Overview |
| GET | `/api/v1/commands` | Recent command history | Commands |
| GET | `/api/v1/reminders` | Pending reminders | Reminders |
| POST | `/api/v1/reminders` | Create reminder | Reminders |
| DELETE | `/api/v1/reminders/{id}` | Delete reminder | Reminders |
| GET | `/api/v1/library/entries` | Browse/filter entries | Library |
| GET | `/api/v1/library/entries/{id}` | Read single entry | Library (modal) |
| PUT | `/api/v1/library/entries/{id}` | Update entry content | Library (edit) |
| POST | `/api/v1/library/entries/{id}/synthesize` | AI Q&A on single entry | Library (AI tab) |
| GET | `/api/v1/library/sections` | List sections | Library (filter) |
| GET | `/api/v1/library/tags` | List all tags | Library (filter) |
| POST | `/api/v1/library/youtube-transcript` | Fetch YouTube transcript | Link Capture |
| GET | `/api/v1/library/graph` | Nodes + edges for graph | Graph |
| GET | `/api/v1/library/timeline` | Chronological stream | Timeline |
| GET | `/api/v1/analysis/tags` | Tag frequencies, trending, orphans | Analysis |
| GET | `/api/v1/analysis/gaps` | Empty sections, stale entries | Analysis |
| GET | `/api/v1/analysis/activity` | Daily counts, velocity | Analysis |
| POST | `/api/v1/analysis/synthesize` | AI synthesis across entries | Analysis |
| GET | `/api/v1/planning/goals` | Active/paused/completed goals | Planning |
| GET | `/api/v1/planning/projects` | Active/completed projects | Planning |
| GET | `/api/v1/planning/reviews` | Weekly/monthly reviews | Planning |
| POST | `/api/v1/planning/review` | Generate AI weekly review | Planning |
| GET | `/api/v1/planning/focus` | AI-suggested priorities | Planning |

---

## Detailed Specs

### GET `/api/v1/dashboard/stats`

```json
{
  "library": {
    "profile": 0,
    "terms": 5,
    "books": 2,
    "articles": 0,
    "thoughts": 7,
    "references": 4
  },
  "integrations": {
    "notion": true,
    "drive": false,
    "gmail": false,
    "gemini": true,
    "firebase": true
  }
}
```

### GET `/api/v1/library/entries`

**Query params:** `?section=terms&status=active&tag=mcp&search=protocol&sort=title_asc&page=1&per_page=20`

| Param | Type | Description |
|-------|------|-------------|
| `section` | string | Filter by section (profile, terms, books, articles, thoughts, references) |
| `status` | string | Filter by status (draft, active, archived) |
| `tag` | string | Filter by single tag |
| `search` | string | Full-text search query |
| `sort` | string | Sort mode: `newest` (default), `oldest`, `title_asc`, `title_desc`, `updated` |
| `order` | string | Override sort direction for raw field names: `asc` or `desc` |
| `page` | int | Page number (1-indexed, default: 1) |
| `per_page` | int | Results per page (1–100, default: 20) |

**Sort modes:**
- `newest` → sort by `captured_at` descending (most recent first)
- `oldest` → sort by `captured_at` ascending (oldest first)
- `title_asc` → sort by `title` ascending (A–Z)
- `title_desc` → sort by `title` descending (Z–A)
- `updated` → sort by `updated_at` descending (most recently modified first)

**Response:**

```json
{
  "entries": [
    {
      "id": "20260421-110205-term-mcp-model-context-protocol",
      "title": "Term: MCP (Model Context Protocol)",
      "section": "terms",
      "category": "term",
      "status": "active",
      "type": "entry",
      "tags": ["mcp", "ai-protocol", "integration"],
      "captured_at": "2026-04-21T11:02",
      "path": "library/terms/20260421-110205-term-mcp-model-context-protocol.md"
    }
  ],
  "total": 47,
  "page": 1,
  "per_page": 20
}
```

### GET `/api/v1/library/entries/{id}`

```json
{
  "id": "20260421-110205-term-mcp-model-context-protocol",
  "title": "Term: MCP (Model Context Protocol)",
  "section": "terms",
  "category": "term",
  "status": "active",
  "type": "entry",
  "tags": ["mcp", "ai-protocol", "integration"],
  "captured_at": "2026-04-21T11:02",
  "path": "library/terms/...",
  "markdown": "# full markdown...",
  "related": ["other-entry-id-1", "other-entry-id-2"]
}
```

### GET `/api/v1/library/graph`

**Query params:** `?max_nodes=200`

```json
{
  "nodes": [
    {
      "id": "entry-1",
      "label": "Term: MCP",
      "section": "terms",
      "status": "active",
      "color": "#a78bfa",
      "size": 11
    }
  ],
  "edges": [
    {
      "source": "entry-1",
      "target": "entry-2",
      "type": "shared_tag",
      "tags": ["mcp"],
      "weight": 1
    }
  ]
}
```

**Node colors by section:**
- profile: `#38bdf8`
- term: `#a78bfa`
- book: `#fbbf24`
- article: `#34d399`
- thought: `#f472b6`
- reference: `#94a3b8`
- research: `#fb923c`

### GET `/api/v1/library/timeline`

**Query params:** `?section=terms&from_date=2026-04-01&to_date=2026-04-30`

```json
{
  "days": [
    {
      "date": "2026-04-21",
      "entries": [
        {"id": "...", "title": "...", "section": "terms", "status": "active", "date": "2026-04-21", "datetime": "2026-04-21T11:02"}
      ]
    }
  ],
  "total": 12,
  "daily_counts": {"2026-04-21": 3, "2026-04-20": 1}
}
```

### GET `/api/v1/analysis/tags`

```json
{
  "frequencies": {"mcp": 5, "ai-protocol": 3, "integration": 8},
  "trending": ["mcp", "autopilot"],
  "orphan_tags": ["unused-tag-1"],
  "co_occurrence": [["mcp", "ai-protocol", 3], ["integration", "tooling", 2]]
}
```

### GET `/api/v1/analysis/gaps`

```json
{
  "empty_sections": ["profile"],
  "stale_entries": [
    {"id": "...", "title": "...", "section": "terms", "days_since_update": 95}
  ],
  "orphan_entries": [
    {"id": "...", "title": "...", "section": "books"}
  ],
  "section_counts": {"terms": 5, "books": 2}
}
```

### POST `/api/v1/analysis/synthesize`

**Body:**
```json
{
  "query": "What do my MCP-related entries say about adoption strategy?",
  "entry_ids": ["entry-1", "entry-2"]
}
```

**Response:**
```json
{
  "status": "ok",
  "synthesis": "AI-generated summary connecting the dots...",
  "sources": ["Term: MCP", "Book Research: AI Team Organization"]
}
```

### GET `/api/v1/planning/goals`

```json
{
  "goals": [
    {"id": "2026-personal-os", "title": "Build personal operating system", "status": "active", "path": "library/goals/..."}
  ],
  "active": [...],
  "completed": [...],
  "paused": [...]
}
```

### POST `/api/v1/planning/review`

**Response:**
```json
{
  "status": "ok",
  "review": "Captured 5 entries this week...",
  "wins": ["Shipped library API", "Added tests"],
  "gaps": ["No book captures"],
  "next_focus": "Deep dive into MCP adoption",
  "recent_count": 5
}
```

### GET `/api/v1/planning/focus`

```json
{
  "status": "ok",
  "active_goals_count": 3,
  "active_goals": ["Build personal OS", "Deploy dashboard"],
  "recent_sections": {"terms": 3, "thoughts": 2},
  "suggestions": [
    "You have 3 active goals.",
    "Most active section: terms (3 entries)."
  ]
}
```

---

## Error Responses

All endpoints return standard HTTP status codes:
- `401` — Missing or invalid Bearer token
- `404` — Entry not found (library endpoints)
- `200` with `{"status": "error", "reply": "..."}` — Business logic error (e.g., missing fields)

---

## Frontend TypeScript Types

See `src/types/index.ts` in the dashboard repo. Key interfaces:

```typescript
export interface LibraryEntry {
  id: string;
  title: string;
  section: string;
  category: string;
  status: string;
  type: string;
  tags: string[];
  captured_at: string;
  path: string;
}

export interface GraphNode {
  id: string;
  label: string;
  section: string;
  status: string;
  color: string;
  size: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: "shared_tag" | "same_section";
  tags?: string[];
  weight: number;
}
```

---

## Changelog

- **2026-05-30** — Documented `sort` and `order` query parameters for `GET /api/v1/library/entries` (title_asc, title_desc, newest, oldest, updated)
- **2026-05-27** — Added Library, Graph, Timeline, Analysis, Planning endpoints (Phases 2–6)
- **2026-05-27** — Added `GET /api/v1/library/entries`, `GET /api/v1/library/entries/{id}`, `GET /api/v1/library/sections`, `GET /api/v1/library/tags`
- **2026-05-27** — Added `GET /api/v1/library/graph`, `GET /api/v1/library/timeline`
- **2026-05-27** — Added `GET /api/v1/analysis/tags`, `GET /api/v1/analysis/gaps`, `GET /api/v1/analysis/activity`, `POST /api/v1/analysis/synthesize`
- **2026-05-27** — Added `GET /api/v1/planning/goals`, `GET /api/v1/planning/projects`, `GET /api/v1/planning/reviews`, `POST /api/v1/planning/review`, `GET /api/v1/planning/focus`
