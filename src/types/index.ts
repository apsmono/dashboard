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
