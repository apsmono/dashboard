import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoginGate } from "./dashboard/LoginGate";

export function LoginPage() {
  const { signIn, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      window.location.replace("#/");
    }
  }, [loading, isAuthenticated]);

  if (loading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return <LoginGate onSignIn={signIn} />;
}
