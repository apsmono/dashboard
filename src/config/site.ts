import type { Project } from "@/types";

export const siteConfig = {
  name: "Arif Eko Pramono",
  tagline: "Fullstack developer — React, React Native & Firebase — building reliable product systems and AI agents, remote from Indonesia.",
  email: "arifekop@ymail.com",
  avatar: "https://avatars.githubusercontent.com/u/51656350?v=4",
  location: "Blitar, East Java, Indonesia",
  bio: [
    "I'm a fullstack developer from Blitar, East Java, Indonesia, with ~4 years building and operating a two-sided travel marketplace end to end on React, React Native, and Firebase. I'm at my best making fragile, production-critical systems trustworthy — migrating live data shapes safely, hardening publish flows, and fixing transactional money bugs.",
    "On the side I build autonomous AI agent systems with real cost guardrails, plus the automation glue of my own personal operating system — Python scrapers, FastAPI backends, and React dashboards like this one.",
  ],
  projects: [
    {
      name: "Intel Digest",
      description:
        "Autonomous AI research agent that produces a weekly competitor/market brief and emails it. Token & tool-call budget guardrails, idempotent scheduled runs, model routing. Working build — not yet launched.",
      tags: ["Python", "CrewAI", "Cloud Run", "Firestore"],
      sourceUrl: "https://github.com/apsmono/mas-agentic",
      icon: "Newspaper",
      status: "active",
    },
    {
      name: "Solo Leveling",
      description:
        "Central brain & command center for personal development, financial freedom, and connected-tool automation. Integrates with Notion, Google Drive, and Gmail.",
      tags: ["Python", "FastAPI", "Docker", "PostgreSQL"],
      sourceUrl: "https://github.com/apsmono/projects",
      icon: "Brain",
      status: "active",
    },
    {
      name: "Wedding Invitation",
      description:
        "Digital wedding invitation for Amal & Arif — mobile-first, modern minimalist design with countdown timer, RSVP via WhatsApp, and photo gallery.",
      tags: ["Vite", "React 19", "TypeScript", "Tailwind CSS"],
      liveUrl: "https://apsmono.github.io/wedding-invitation/",
      sourceUrl: "https://github.com/apsmono/wedding-invitation",
      icon: "Heart",
      status: "shipped",
    },
    {
      name: "Koperasi KKS",
      description:
        "Landing page for Koperasi Konsumen Karya Tunggal Sejahtera. Static, fast, and ready for Cloudflare Pages deployment.",
      tags: ["HTML5", "CSS3", "JavaScript"],
      sourceUrl: "https://github.com/apsmono/koperasi",
      icon: "Landmark",
      status: "shipped",
    },
    {
      name: "makeICS",
      description:
        "Translate data sources into iCalendar format so you can sync them directly to your phone's calendar. Simple, scriptable, and useful.",
      tags: ["Python", "iCalendar"],
      sourceUrl: "https://github.com/apsmono/makeICS",
      icon: "CalendarDays",
      status: "shipped",
    },
    {
      name: "Scrapers",
      description:
        "Python automation scripts for data collection and processing. Modular scrapers with environment-based config and clean logging.",
      tags: ["Python", "Automation"],
      sourceUrl: "https://github.com/apsmono/projects",
      icon: "Bug",
      status: "active",
    },
    {
      name: "Portfolio Dashboard",
      description:
        "This very site — a portfolio landing page plus an authenticated command center with Firebase Auth, library stats, and integration health monitoring.",
      tags: ["React", "TypeScript", "Tailwind CSS", "Firebase"],
      liveUrl: "https://dashboard.apsmono.com/",
      sourceUrl: "https://github.com/apsmono/dashboard",
      icon: "LayoutDashboard",
      status: "active",
    },
  ] satisfies Project[],
  skills: [
    { name: "Python", icon: "Code2" },
    { name: "FastAPI", icon: "Zap" },
    { name: "Docker", icon: "Container" },
    { name: "PostgreSQL", icon: "Database" },
    { name: "Firebase", icon: "Flame" },
    { name: "JavaScript", icon: "Braces" },
    { name: "TypeScript", icon: "FileType" },
    { name: "React", icon: "Atom" },
    { name: "Tailwind CSS", icon: "Wind" },
    { name: "Vite", icon: "Bolt" },
    { name: "Git", icon: "GitBranch" },
    { name: "Linux", icon: "Terminal" },
    { name: "HTML5", icon: "Code" },
    { name: "CSS3", icon: "Paintbrush" },
    { name: "React Native", icon: "Smartphone" },
    { name: "Automation", icon: "Cog" },
  ],
  contacts: [
    { label: "Email", value: "arifekop@ymail.com", href: "mailto:arifekop@ymail.com", icon: "Mail" },
    { label: "GitHub", value: "@apsmono", href: "https://github.com/apsmono", icon: "Github" },
    { label: "Instagram", value: "@apsmono", href: "https://instagram.com/apsmono", icon: "Instagram" },
    { label: "Threads", value: "@apsmono", href: "https://threads.net/@apsmono", icon: "AtSign" },
    { label: "Facebook", value: "apsmono", href: "https://facebook.com/apsmono", icon: "Facebook" },
  ],
};
