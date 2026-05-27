# Design System

## Color Tokens

| Token | Dark | Light |
|-------|------|-------|
| `--color-bg` | `#0f1117` | `#f8fafc` |
| `--color-card` | `#161922` | `#ffffff` |
| `--color-surface` | `#1e2330` | `#f1f5f9` |
| `--color-text` | `#e2e8f0` | `#0f172a` |
| `--color-muted` | `#94a3b8` | `#64748b` |
| `--color-accent` | `#38bdf8` | `#0284c7` |
| `--color-danger` | `#ef4444` | `#dc2626` |
| `--color-success` | `#22c55e` | `#16a34a` |
| `--color-warning` | `#f59e0b` | `#d97706` |
| `--color-border` | `#334155` | `#cbd5e1` |

## Typography

- **Font Family**: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Base Size**: `16px`
- **Scale**: H1 (4xl-6xl), H2 (3xl), H3 (lg), Body (base), Small (sm), XS (xs)

## Spacing

- Container max-width: `960px` (portfolio), `1024px` (dashboard)
- Section padding: `py-20 px-6`
- Card padding: `p-5`
- Grid gap: `1rem` to `1.5rem`

## Components

### Button
- Primary: `bg-accent text-white`
- Secondary: `bg-card text-text border-border`
- Ghost: `bg-transparent text-muted border-border`
- Danger: `bg-transparent text-danger border-danger`

### Card
- Background: `bg-card`
- Border: `1px solid border`
- Radius: `12px`
- Shadow: `0 1px 3px var(--shadow)`
- Hover: `-translate-y-1` on project cards

### Badge
- Default: `bg-surface text-muted`
- Accent: `bg-accent/10 text-accent`

## Icons

- **Library**: Lucide React
- **Size**: 16px (inline), 20px (nav), 24px (cards), 48px (hero/project)
- **Color**: Inherits from parent or uses `text-accent`

## Theme

- Dark / Light / System modes
- Stored in `localStorage` under key `dash-theme`
- System mode listens to `prefers-color-scheme`
