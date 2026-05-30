export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Command {
  id: string;
  text: string;
  intent: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  message: string;
  run_at: string;
}

export interface DashboardStats {
  library: {
    profile: number;
    terms: number;
    books: number;
    articles: number;
    thoughts: number;
    references: number;
  };
  integrations: Record<string, boolean>;
}

export interface Project {
  name: string;
  description: string;
  tags: string[];
  liveUrl?: string;
  sourceUrl: string;
  icon: string;
}

export interface Skill {
  name: string;
  icon: string;
}

export interface Contact {
  label: string;
  value: string;
  href: string;
  icon: string;
}

export interface LibraryEntry {
  id: string;
  title: string;
  section: string;
  category: string;
  status: string;
  type: string;
  tags: string[];
  captured_at: string;
  source_url?: string;
  path: string;
  markdown?: string;
  related?: string[];
}

export interface LibraryListResponse {
  entries: LibraryEntry[];
  total: number;
  page: number;
  per_page: number;
}

export type ViewMode = "cards" | "compact" | "table";

export interface LibraryFilters {
  search?: string;
  section?: string;
  tag?: string;
  status?: string;
  source_url?: string;
  sort?: string;
  order?: string;
  page?: number;
  per_page?: number;
}

export interface BadgeDefinition {
  id: string;
  label: string;
  desc: string;
  xpBonus: number;
  unlocked: boolean;
  icon?: string;
}

export interface LevelDefinition {
  level: number;
  minXp: number;
  label: string;
}

export interface GamificationState {
  xp: number;
  level: number;
  xpToNext: number;
  progressPercent: number;
  totalEntries: number;
  currentStreak: number;
  badges: BadgeDefinition[];
  unlockedCount: number;
  totalCount: number;
}
