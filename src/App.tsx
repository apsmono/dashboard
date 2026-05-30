import { useEffect, useState } from "react";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { LoginPage } from "@/components/LoginPage";
import { NotFound } from "@/components/NotFound";
import { routeToTabState } from "@/lib/dashboardRoutes";

function getHashRoute(): string {
  return window.location.hash.replace("#", "") || "/";
}

function RedirectToPortfolio() {
  useEffect(() => {
    window.location.href = "https://www.apsmono.com";
  }, []);
  return null;
}

export default function App() {
  const [route, setRoute] = useState(getHashRoute);

  useEffect(() => {
    const handleHashChange = () => setRoute(getHashRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  switch (true) {
    // /view* redirects to portfolio — must be first so /view is never swallowed by the dashboard
    case route === "/view" || route.startsWith("/view"):
      return <RedirectToPortfolio />;
    case route === "/login":
      return <LoginPage />;
    // All dashboard-owned paths: /, /library, /library?..., /planning, /overview,
    // /graph, /timeline, /analysis, /calendar, /commands, /reminders
    case routeToTabState(route) !== null:
      return <DashboardPage />;
    default:
      return <NotFound />;
  }
}
