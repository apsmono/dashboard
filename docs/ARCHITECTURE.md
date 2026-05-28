# Architecture

## File Structure

```
dashboard/
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Hash router: / → Dashboard, /view → Portfolio
│   ├── config/
│   │   └── site.ts           # All editable content (projects, skills, contacts)
│   ├── components/
│   │   ├── ui/               # Base components (Button, Card, Badge, Input)
│   │   ├── layout/           # Navbar, Footer, ThemeProvider
│   │   ├── portfolio/        # Hero, About, Projects, Skills, Contact
│   │   └── dashboard/        # LoginGate, Overview, Commands, Reminders, etc.
│   ├── hooks/
│   │   ├── useAuth.ts        # Firebase auth state + signIn/signOut
│   │   ├── useApi.ts         # Data fetching hooks (stats, commands, reminders)
│   │   └── useTheme.ts       # Theme preference (dark/light/system)
│   ├── lib/
│   │   ├── firebase.ts       # Firebase init, Google sign-in
│   │   ├── api.ts            # Typed fetch wrapper with Bearer token
│   │   └── utils.ts          # cn(), formatDate()
│   ├── types/
│   │   └── index.ts          # Shared TypeScript interfaces
│   └── styles/
│       └── globals.css       # Tailwind import + CSS variables
├── docs/
│   ├── DESIGN.md
│   └── ARCHITECTURE.md
├── .github/workflows/
│   └── deploy.yml            # Build + deploy to GitHub Pages
└── vite.config.ts            # base: '/'
```

## Auth Flow

1. User opens `https://dashboard.apsmono.com/`
2. `App.tsx` renders `DashboardPage`
3. `useAuth` listens to Firebase `onAuthStateChanged`
4. If loading → spinner
5. If authenticated → show dashboard
6. If not authenticated → show `LoginGate`
7. Click "Sign in with Google" → `signInWithPopup` → Firebase token
8. All API calls include `Authorization: Bearer <token>`
9. Backend verifies token with Firebase Admin SDK

## Routing

Hash-based routing for GitHub Pages compatibility:
- `#/` → Dashboard (auth-gated)
- `#/view` → Public portfolio

## Data Flow

```
Dashboard components → useApi hooks → api.ts → FastAPI backend
                              ↑
                        Bearer token from firebase.ts
```

## Deploy Pipeline

1. Push to `main`
2. GitHub Actions runs `bun install --frozen-lockfile && bun run build`
3. `VITE_FIREBASE_API_KEY` and `VITE_API_BASE` injected from secrets
4. Static files uploaded to GitHub Pages
