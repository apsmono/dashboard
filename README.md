# Dashboard

React + TypeScript portfolio and authenticated command center.

## Stack

- **Vite** — Build tool
- **React 19** — UI framework
- **TypeScript** — Type safety
- **Tailwind CSS v4** — Styling
- **Lucide React** — Icons
- **Firebase Auth** — Google Sign-In
- **cmdk** — Command palette

## Features

### Command Center
- **Cmd+K Command Palette** — Global search across library entries, quick navigation, instant commands
- **Quick Capture** — Send commands to the brain directly from the dashboard
- **Theme Toggle** — Dark / light / system mode with persistent preference

### Library
- **Multi-View Display** — Switch between card view, compact list view, and sortable table view
- **Advanced Sorting** — Sort by newest/oldest capture date, title (A–Z / Z–A), or last updated
- **Filtering** — Filter by section, tags, and status; full-text search across all entries
- **Pull-to-Refresh** — Mobile-style pull gesture to reload library entries
- **Random Note** — Surface a random entry for rediscovery
- **Focus Mode** — Distraction-free fullscreen reading for entries
- **AI Q&A per Entry** — Ask questions about any entry with isolated chat history per item
- **YouTube Transcript Auto-Fetch** — Backend automatically fetches transcripts for YouTube stubs
- **Link Preview** — See title and metadata before saving a link
- **Duplicate Detection** — Warns if a URL already exists in the library

### Overview Widgets
- **Activity Heatmap** — GitHub-style 12-week activity visualization
- **Streak Counter** — Current, best, and total activity streaks
- **Gamification Badges** — Achievements: First Capture, Collector, Librarian, Explorer, Streaker, Master
- **Library Stats** — Entry counts by section (profile, terms, books, articles, thoughts, references)
- **Integration Health** — Real-time status of brain integrations
- **Active Goals** — List of current goals from the brain
- **Recent Commands** — History of sent commands
- **AI Suggestions** — One-click suggested queries

### Navigation
- **Keyboard Shortcuts** — `/` to focus search, `Cmd+K` for command palette, `1-9` for tab switching
- **Mobile Bottom Nav** — Primary tabs + "More" drawer with secondary tabs (Graph, Timeline, Analysis, Commands, Reminders)
- **Desktop Nav Tabs** — Full tab bar with all sections

### Views
- **Overview** — Command center hub with widgets
- **Library** — Searchable, filterable knowledge base
- **Graph** — Interactive force-directed knowledge graph with section filtering
- **Timeline** — Chronological activity view
- **Analysis** — Tags, gaps, and activity analytics
- **Planning** — Goals and projects
- **Commands** — Full command history
- **Reminders** — Scheduled reminders

## Development

```bash
bun install
bun run dev
```

Open `http://localhost:5173/`

## Build

```bash
bun run build
```

Output goes to `dist/`.

## Configuration

Set these in GitHub Actions secrets for deploy:

| Secret | Description |
|--------|-------------|
| `FIREBASE_API_KEY` | Firebase web API key |
| `API_BASE` | Backend URL (default: `https://macmini.local:8000`) |

For local development, create `.env`:

```
VITE_FIREBASE_API_KEY=your_key
VITE_API_BASE=https://macmini.local:8000
```

## URLs

| Path | Description |
|------|-------------|
| `/` | Dashboard (auth-gated) |
| `/#/view` | Public portfolio |

## Project Structure

See `docs/ARCHITECTURE.md` for full details.
