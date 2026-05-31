import { useState, Suspense, lazy, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useViewMode } from "@/hooks/useViewMode";
import { useMutationQueue } from "@/hooks/useMutationQueue";
import { useZenContextualActions } from "@/hooks/useZenContextualActions";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { CommandPalette } from "@/components/CommandPalette";
import { KeyboardCheatsheet } from "./KeyboardCheatsheet";
import { AIGuidePanel, type GuideMessage } from "@/components/guide/AIGuidePanel";
import { LayoutProvider, useLayoutContext } from "@/components/layout/LayoutProvider";
import { LayoutSettingsPanel } from "@/components/layout/LayoutSettingsPanel";
import { ZenShell } from "@/components/zen/ZenShell";
import { ClarityBoard } from "@/components/zen/ClarityBoard";
import type { ZenView } from "@/components/zen/types";
import { routeToTabState, tabStateToRoute } from "@/lib/dashboardRoutes";
import { sendCommand, sendGuideCommand } from "@/lib/api";
import { flushMutationQueue } from "@/lib/sync";
import {
  LogOut,
  WifiOff,
  LayoutDashboard,
  BookOpen,
  Target,
  MessageSquare,
  Search,
  GitBranch,
  Calendar,
  CalendarDays,
  BarChart3,
  Terminal,
  Bell,
  MoreHorizontal,
  X,
  Settings,
} from "lucide-react";

const GraphPage = lazy(() => import("@/components/graph/GraphPage").then((m) => ({ default: m.GraphPage })));
const TimelinePage = lazy(() => import("@/components/timeline/TimelinePage").then((m) => ({ default: m.TimelinePage })));
const AnalysisPage = lazy(() => import("@/components/analysis/AnalysisPage").then((m) => ({ default: m.AnalysisPage })));
const CalendarPage = lazy(() => import("@/components/calendar/CalendarPage").then((m) => ({ default: m.CalendarPage })));
const Commands = lazy(() => import("./Commands").then((m) => ({ default: m.Commands })));
const Reminders = lazy(() => import("./Reminders").then((m) => ({ default: m.Reminders })));

const MOBILE_TABS: { id: ZenView | "guide" | "more"; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "core", label: "Home", icon: LayoutDashboard },
  { id: "library", label: "Library", icon: BookOpen },
  { id: "planner", label: "Plan", icon: Target },
  { id: "guide", label: "Guide", icon: MessageSquare },
];

const MORE_TABS = [
  { id: "graph", label: "Graph", icon: GitBranch },
  { id: "timeline", label: "Timeline", icon: Calendar },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "analysis", label: "Analysis", icon: BarChart3 },
  { id: "commands", label: "Commands", icon: Terminal },
  { id: "reminders", label: "Reminders", icon: Bell },
];

function zenViewFromTab(tab: string): ZenView {
  if (tab === "library" || tab === "planner") return tab;
  return "core";
}

export function DashboardPage() {
  return (
    <LayoutProvider>
      <DashboardPageContent />
    </LayoutProvider>
  );
}

function DashboardPageContent() {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const {
    onboardingState,
    onboardingStep,
    profile: onboardingProfile,
    identityText,
    setIdentityText,
    handleProfileParsed,
    handleStepChange,
    handleComplete,
  } = useOnboarding();
  // Hydrate initial tab state from the URL hash so refresh/deep-link lands on the
  // correct tab. App.tsx only renders DashboardPageContent when routeToTabState is
  // non-null, so `initial` will always be non-null here; the fallback is a safety guard.
  const [zenView, setZenView] = useState<ZenView>(() => {
    const initial = routeToTabState(window.location.hash) ?? { zenView: "core", moreTab: null };
    return initial.zenView;
  });
  const [moreTab, setMoreTab] = useState<string | null>(() => {
    const initial = routeToTabState(window.location.hash) ?? { zenView: "core", moreTab: null };
    return initial.moreTab;
  });
  // Write the URL hash whenever zenView or moreTab changes so that refreshing
  // or bookmarking the page lands on the correct tab (write-side of Task 3).
  //
  // Rules:
  // - tabStateToRoute returns "/library" for the library tab. We only write
  //   "#/library" on ARRIVAL (when the current hash does not already start
  //   with "#/library"). This lets useLibraryUrlState own "#/library?..."
  //   (view/sort/search/page) while the user stays on the Library tab, but
  //   ensures the base route is set when navigating here from another tab.
  // - Use replaceState (not pushState) to avoid flooding browser history on
  //   every tab click — consistent with useLibraryUrlState's own approach.
  // - replaceState does NOT fire hashchange, so App.tsx's listener is not
  //   triggered and DashboardPage does not remount.
  // - Guard: skip the write if the hash already equals the target route to
  //   prevent a redundant replaceState on the very first render (Task 3
  //   already hydrated the state from the hash, so they already match).
  useEffect(() => {
    const route = tabStateToRoute({ zenView, moreTab });
    const target = `#${route}`;
    // Library arrival guard: only write "#/library" when not already on a
    // library route (e.g. "#/library?entry=...&view=table"). useLibraryUrlState
    // owns the query string once you are on the Library tab.
    if (route === "/library") {
      const currentHash = window.location.hash.toLowerCase();
      if (currentHash.startsWith("#/library")) return;
    }
    if (window.location.hash !== target) {
      window.history.replaceState(null, "", target);
    }
  }, [zenView, moreTab]);

  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileGuideOpen, setMobileGuideOpen] = useState(false);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  const [layoutSettingsOpen, setLayoutSettingsOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [guideMessages, setGuideMessages] = useState<GuideMessage[]>([]);
  const [guideLoading, setGuideLoading] = useState(false);
  const { isOnline, resetWasOffline } = useOnlineStatus();
  const { count: pendingCount, refresh: refreshQueue } = useMutationQueue();
  const { viewMode } = useViewMode();
  const { isPanelVisible } = useLayoutContext();
  const guideVisible = isPanelVisible("guide");

  useEffect(() => {
    const interval = setInterval(refreshQueue, 2000);
    return () => clearInterval(interval);
  }, [refreshQueue]);

  const focusSearch = useCallback(() => {
    setZenView("library");
    window.dispatchEvent(new CustomEvent("focus-library-search"));
  }, []);

  const handleDraftReply = useCallback(async () => {
    setGuideLoading(true);
    try {
      const res = await sendGuideCommand("draft a friendly reply to the selected email");
      setGuideMessages((prev) => [
        ...prev,
        { role: "user", content: "Draft a friendly reply" },
        { role: "assistant", content: res.reply ?? "Draft ready when Smart Drafts lands in Phase 7." },
      ]);
      setMobileGuideOpen(true);
    } finally {
      setGuideLoading(false);
    }
  }, []);

  const contextualActions = useZenContextualActions({
    activeView: zenView,
    selectedCardId,
    onFocusLibrarySearch: focusSearch,
    onDraftReply: handleDraftReply,
    onAddTask: () => setZenView("planner"),
  });

  const handleTabChange = useCallback((tab: string) => {
    if (tab === "guide") {
      setMobileGuideOpen(true);
      setMoreOpen(false);
      return;
    }
    if (tab === "more") {
      setMoreOpen((v) => !v);
      return;
    }
    setZenView(zenViewFromTab(tab));
    setMoreTab(null);
    setMoreOpen(false);
    setMobileGuideOpen(false);
  }, []);

  const keyboardTab = useMemo(() => {
    if (moreTab) return moreTab;
    return zenView === "core" ? "overview" : zenView;
  }, [zenView, moreTab]);

  useKeyboardShortcuts(keyboardTab, handleTabChange, focusSearch, undefined, () => setCheatsheetOpen(true));

  if (loading || onboardingState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.replace("#/login");
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const header = (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur-sm lg:px-6">
      {(!isOnline || pendingCount > 0) && (
        <div
          className={`mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            !isOnline
              ? "border-warning bg-warning/10 text-warning"
              : "border-success bg-success/10 text-success"
          }`}
        >
          <WifiOff size={14} />
          <span className="flex-1">
            {!isOnline
              ? `You are offline. ${pendingCount > 0 ? `${pendingCount} change${pendingCount > 1 ? "s" : ""} queued.` : "Some features may not work."}`
              : `${pendingCount} change${pendingCount > 1 ? "s" : ""} queued. Ready to sync.`}
          </span>
          {isOnline && pendingCount > 0 && (
            <button
              type="button"
              onClick={async () => {
                await flushMutationQueue();
                refreshQueue();
                resetWasOffline();
                window.dispatchEvent(new CustomEvent("brain-command-sent"));
              }}
              className="rounded-md bg-warning px-2 py-0.5 text-xs font-medium text-white hover:opacity-90"
            >
              Sync now
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">Signal</h1>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            className="hidden items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-xs text-muted hover:text-text sm:flex"
          >
            <Search size={12} />
            <span>⌘K</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLayoutSettingsOpen(true)}
            className="rounded-lg border border-border bg-card p-2 text-muted hover:text-text"
            aria-label="Layout settings"
          >
            <Settings size={16} />
          </button>
          <span className="hidden text-sm text-muted sm:inline">{user?.email}</span>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted hover:text-text"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );

  const panelA = (
    <>
      <CommandPalette
        onNavigate={(tab) => {
          const clean = tab.replace(/\?.*$/, "");
          if (clean === "library" || clean === "planning") {
            setZenView(clean === "planning" ? "planner" : "library");
          } else {
            setMoreTab(clean);
          }
        }}
        onCommand={async (text) => {
          await sendCommand(text);
          setZenView("core");
        }}
      />

      {onboardingState === "onboarding" ? (
        <OnboardingWizard
          step={onboardingStep}
          profile={onboardingProfile}
          identityText={identityText}
          onStepChange={handleStepChange}
          onComplete={handleComplete}
          onProfileParsed={handleProfileParsed}
          onIdentityTextChange={setIdentityText}
        />
      ) : moreTab ? (
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          }
        >
          <div className="py-4">
            <button
              type="button"
              onClick={() => setMoreTab(null)}
              className="mb-4 text-sm text-muted hover:text-accent"
            >
              ← Back to Clarity Board
            </button>
            {moreTab === "graph" && <GraphPage />}
            {moreTab === "timeline" && <TimelinePage />}
            {moreTab === "analysis" && <AnalysisPage />}
            {moreTab === "calendar" && <CalendarPage />}
            {moreTab === "commands" && <Commands />}
            {moreTab === "reminders" && <Reminders />}
          </div>
        </Suspense>
      ) : (
        <ClarityBoard
          activeView={zenView}
          onViewChange={(view) => {
            // Clear moreTab so that tabStateToRoute produces the correct
            // canonical route for the selected top-level view. Without this
            // a stale moreTab causes the write-effect to emit e.g. "/graph"
            // instead of "/" when the user clicks "Core Dashboard".
            setZenView(view);
            setMoreTab(null);
          }}
          selectedCardId={selectedCardId}
          onSelectCard={setSelectedCardId}
          onContextAction={(actionId) => {
            if (actionId === "draft") handleDraftReply();
            if (actionId === "open") setZenView("library");
          }}
        />
      )}

      <KeyboardCheatsheet open={cheatsheetOpen} onClose={() => setCheatsheetOpen(false)} />
    </>
  );

  const panelB = guideVisible ? (
    <AIGuidePanel
      activeView={zenView}
      visible
      contextualActions={contextualActions}
      messages={guideMessages}
      setMessages={setGuideMessages}
      loading={guideLoading}
      setLoading={setGuideLoading}
    />
  ) : (
    <div className="flex h-full items-center justify-center p-4 text-sm text-muted">
      Guide panel hidden — enable in layout settings.
    </div>
  );

  const mobileFooter =
    viewMode === "mobile" ? (
      <>
        {mobileGuideOpen && (
          <>
            <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setMobileGuideOpen(false)} />
            <div className="fixed inset-x-0 bottom-0 top-16 z-50 bg-bg lg:hidden">
              {panelB}
            </div>
          </>
        )}
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm lg:hidden">
          <div className="mx-auto flex max-w-md items-center justify-around py-2">
            {MOBILE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive =
                tab.id === "guide"
                  ? mobileGuideOpen
                  : tab.id !== "more" && zenView === tab.id && !moreTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
                    isActive ? "text-accent" : "text-muted"
                  }`}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
                moreOpen || moreTab ? "text-accent" : "text-muted"
              }`}
            >
              <MoreHorizontal size={20} />
              <span>More</span>
            </button>
          </div>
        </nav>
        {moreOpen && (
          <>
            <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMoreOpen(false)} />
            <div className="fixed bottom-16 left-2 right-2 z-40 rounded-xl border border-border bg-card p-3 shadow-lg lg:hidden">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-muted">More tools</span>
                <button type="button" onClick={() => setMoreOpen(false)} className="text-muted">
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MORE_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setMoreTab(tab.id);
                        setMoreOpen(false);
                        setMobileGuideOpen(false);
                      }}
                      className="flex flex-col items-center gap-1 rounded-lg border border-border bg-surface p-3 text-xs text-muted hover:text-text"
                    >
                      <Icon size={18} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </>
    ) : null;

  return (
    <>
      <ZenShell header={header} panelA={panelA} panelB={panelB} footer={mobileFooter} />
      <LayoutSettingsPanel open={layoutSettingsOpen} onClose={() => setLayoutSettingsOpen(false)} />
    </>
  );
}
