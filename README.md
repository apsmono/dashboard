# Dashboard

React + TypeScript portfolio and authenticated command center.

## Stack

- **Vite** — Build tool
- **React 19** — UI framework
- **TypeScript** — Type safety
- **Tailwind CSS v4** — Styling
- **Lucide React** — Icons
- **Firebase Auth** — Google Sign-In

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
