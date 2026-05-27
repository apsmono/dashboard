import { useState, Suspense, lazy } from "react";
import { useAuth } from "@/hooks/useAuth";
import { NavTabs } from "./NavTabs";
import { Toolbar } from "./Toolbar";
import { Overview } from "./Overview";
import { Commands } from "./Commands";
import { Reminders } from "./Reminders";
import { CommandInput } from "./CommandInput";
import { LogOut } from "lucide-react";

const LibraryPage = lazy(() => import("@/components/library/LibraryPage").then((m) => ({ default: m.LibraryPage })));
const GraphPage = lazy(() => import("@/components/graph/GraphPage").then((m) => ({ default: m.GraphPage })));
const TimelinePage = lazy(() => import("@/components/timeline/TimelinePage").then((m) => ({ default: m.TimelinePage })));
const AnalysisPage = lazy(() => import("@/components/analysis/AnalysisPage").then((m) => ({ default: m.AnalysisPage })));
const PlanningPage = lazy(() => import("@/components/planning/PlanningPage").then((m) => ({ default: m.PlanningPage })));

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

        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        }>
          {activeTab === "overview" && <Overview />}
          {activeTab === "library" && <LibraryPage />}
          {activeTab === "graph" && <GraphPage />}
          {activeTab === "timeline" && <TimelinePage />}
          {activeTab === "analysis" && <AnalysisPage />}
          {activeTab === "planning" && <PlanningPage />}
          {activeTab === "commands" && <Commands />}
          {activeTab === "reminders" && <Reminders />}
          {activeTab === "cmd" && <CommandInput />}
        </Suspense>
      </div>
    </div>
  );
}
