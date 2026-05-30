import type { ZenView } from "@/components/zen/types";

/** Tab state that DashboardPage initializes from the hash route. */
export interface TabState {
  zenView: ZenView;
  moreTab: string | null;
}

/**
 * The set of valid more-tab segment identifiers.
 * Kept as a module constant so DashboardPage and tests can import it
 * and stay in sync without duplication.
 */
export const MORE_TAB_SEGMENTS = new Set([
  "graph",
  "timeline",
  "analysis",
  "calendar",
  "commands",
  "reminders",
]);

/**
 * Pure function — no window access.
 *
 * Maps a hash-stripped route string (the same shape that App.tsx's
 * `getHashRoute` returns: leading "/", possible "?querystring") to the
 * matching DashboardPage tab state, or `null` for routes NOT owned by
 * the dashboard (unknown routes, "/view*", "/login").
 *
 * - Strip any leading "#"
 * - Strip query string at the first "?"
 * - Strip a single leading "/"
 * - Lowercase the resulting bare segment
 * - Map to { zenView, moreTab } or null
 */
export function routeToTabState(route: string): TabState | null {
  // Strip any stray leading "#" (caller may pass window.location.hash directly)
  let r = route.startsWith("#") ? route.slice(1) : route;
  // Strip query string
  const qIdx = r.indexOf("?");
  if (qIdx !== -1) r = r.slice(0, qIdx);
  // Strip leading "/"
  if (r.startsWith("/")) r = r.slice(1);
  // Normalise
  const segment = r.toLowerCase();

  // Root / overview → core view
  if (segment === "" || segment === "overview" || segment === "core") {
    return { zenView: "core", moreTab: null };
  }

  // Library tab
  if (segment === "library") {
    return { zenView: "library", moreTab: null };
  }

  // Planner tab (accept both "planning" and "planner")
  if (segment === "planning" || segment === "planner") {
    return { zenView: "planner", moreTab: null };
  }

  // More-tab routes
  if (MORE_TAB_SEGMENTS.has(segment)) {
    return { zenView: "core", moreTab: segment };
  }

  // Anything else (including "view", "login", unknown segments) → not ours
  return null;
}

/**
 * Pure function — no window access.
 *
 * The write-side inverse of `routeToTabState`. Maps a DashboardPage tab state
 * to the canonical hash route string to write via `history.replaceState`.
 *
 * Returns `"/library"` for the library tab as the arrival route. The caller
 * (DashboardPage write-effect) is responsible for the arrival guard: only
 * write `#/library` when the current hash does NOT already start with
 * `#/library` (case-insensitive). That lets `useLibraryUrlState` continue
 * to own `#/library?...` (view/sort/search/page) while you stay on the tab,
 * but ensures the base route is set when arriving from another tab.
 *
 * Round-trip guarantee (for all states):
 *   routeToTabState(tabStateToRoute(s)) deep-equals s
 *
 * Mapping table:
 *   zenView "library"                   → "/library"     (arrival route; caller guards against clobbering)
 *   zenView "core",    moreTab set      → "/" + moreTab  (e.g. "/graph")
 *   zenView "planner", moreTab null     → "/planning"    (canonical write form)
 *   zenView "core",    moreTab null     → "/"            (home)
 */
export function tabStateToRoute({ zenView, moreTab }: TabState): string {
  // Library arrival route — caller must guard: only write when not already on #/library*.
  if (zenView === "library") return "/library";

  // More-tab routes take precedence over zenView when moreTab is set.
  if (moreTab !== null) return `/${moreTab}`;

  // Planner
  if (zenView === "planner") return "/planning";

  // Core / home (zenView === "core", moreTab === null)
  return "/";
}
