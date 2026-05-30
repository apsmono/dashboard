import { describe, it, expect } from "vitest";
import { routeToTabState } from "./dashboardRoutes";

describe("routeToTabState", () => {
  // Library routes
  it('"/library" → { zenView: "library", moreTab: null }', () => {
    expect(routeToTabState("/library")).toEqual({ zenView: "library", moreTab: null });
  });

  it('"/library?entry=abc&view=table" → { zenView: "library", moreTab: null } (query string ignored)', () => {
    expect(routeToTabState("/library?entry=abc&view=table")).toEqual({ zenView: "library", moreTab: null });
  });

  // Planning/planner routes (both accepted)
  it('"/planning" → { zenView: "planner", moreTab: null }', () => {
    expect(routeToTabState("/planning")).toEqual({ zenView: "planner", moreTab: null });
  });

  it('"/planner" → { zenView: "planner", moreTab: null }', () => {
    expect(routeToTabState("/planner")).toEqual({ zenView: "planner", moreTab: null });
  });

  // Overview / root routes
  it('"/overview" → { zenView: "core", moreTab: null }', () => {
    expect(routeToTabState("/overview")).toEqual({ zenView: "core", moreTab: null });
  });

  it('"/" → { zenView: "core", moreTab: null }', () => {
    expect(routeToTabState("/")).toEqual({ zenView: "core", moreTab: null });
  });

  it('"" → { zenView: "core", moreTab: null }', () => {
    expect(routeToTabState("")).toEqual({ zenView: "core", moreTab: null });
  });

  // More-tab routes
  it('"/graph" → { zenView: "core", moreTab: "graph" }', () => {
    expect(routeToTabState("/graph")).toEqual({ zenView: "core", moreTab: "graph" });
  });

  it('"/timeline" → { zenView: "core", moreTab: "timeline" }', () => {
    expect(routeToTabState("/timeline")).toEqual({ zenView: "core", moreTab: "timeline" });
  });

  it('"/analysis" → { zenView: "core", moreTab: "analysis" }', () => {
    expect(routeToTabState("/analysis")).toEqual({ zenView: "core", moreTab: "analysis" });
  });

  it('"/calendar" → { zenView: "core", moreTab: "calendar" }', () => {
    expect(routeToTabState("/calendar")).toEqual({ zenView: "core", moreTab: "calendar" });
  });

  it('"/commands" → { zenView: "core", moreTab: "commands" }', () => {
    expect(routeToTabState("/commands")).toEqual({ zenView: "core", moreTab: "commands" });
  });

  it('"/reminders" → { zenView: "core", moreTab: "reminders" }', () => {
    expect(routeToTabState("/reminders")).toEqual({ zenView: "core", moreTab: "reminders" });
  });

  // Unknown routes → null
  it('"/nonsense" → null (genuinely unknown route)', () => {
    expect(routeToTabState("/nonsense")).toBeNull();
  });

  // App.tsx-owned routes that must NOT be swallowed by the dashboard
  it('"/view" → null (owned by App.tsx redirect, not the dashboard)', () => {
    expect(routeToTabState("/view")).toBeNull();
  });

  it('"/login" → null (owned by App.tsx LoginPage, not the dashboard)', () => {
    expect(routeToTabState("/login")).toBeNull();
  });
});
