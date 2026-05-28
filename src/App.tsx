import { useEffect, useState } from "react";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { LoginPage } from "@/components/LoginPage";
import { NotFound } from "@/components/NotFound";

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
    case route === "/" || route === "":
      return <DashboardPage />;
    case route === "/view" || route.startsWith("/view"):
      return <RedirectToPortfolio />;
    case route === "/login":
      return <LoginPage />;
    default:
      return <NotFound />;
  }
}
