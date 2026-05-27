import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { NavTabs } from "./NavTabs";
import { Toolbar } from "./Toolbar";
import { Overview } from "./Overview";
import { Commands } from "./Commands";
import { Reminders } from "./Reminders";
import { CommandInput } from "./CommandInput";
import { Placeholder } from "./Placeholder";
import { LogOut } from "lucide-react";

export function DashboardPage() {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.replace("#/view");
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted sm:inline">{user?.email}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted transition-colors hover:text-text"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </header>

        <Toolbar />
        <NavTabs active={activeTab} onChange={setActiveTab} />

        {activeTab === "overview" && <Overview />}
        {activeTab === "library" && <Placeholder title="Library Browser" phase="Coming in Phase 2" />}
        {activeTab === "graph" && <Placeholder title="Knowledge Graph" phase="Coming in Phase 3" />}
        {activeTab === "timeline" && <Placeholder title="Timeline" phase="Coming in Phase 4" />}
        {activeTab === "analysis" && <Placeholder title="Analysis" phase="Coming in Phase 5" />}
        {activeTab === "planning" && <Placeholder title="Planning" phase="Coming in Phase 6" />}
        {activeTab === "commands" && <Commands />}
        {activeTab === "reminders" && <Reminders />}
        {activeTab === "cmd" && <CommandInput />}
      </div>
    </div>
  );
}
