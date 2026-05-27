import { useEffect, useState } from "react";
import { PortfolioPage } from "@/components/portfolio/PortfolioPage";
import { DashboardPage } from "@/components/dashboard/DashboardPage";

function getHashRoute(): string {
  return window.location.hash.replace("#", "") || "/";
}

export default function App() {
  const [route, setRoute] = useState(getHashRoute);

  useEffect(() => {
    const handleHashChange = () => setRoute(getHashRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Portfolio view
  if (route === "/view" || route.startsWith("/view")) {
    return <PortfolioPage />;
  }

  // Default: dashboard
  return <DashboardPage />;
}
