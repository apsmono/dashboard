import { useState, useEffect, useCallback } from "react";
import type { User } from "firebase/auth";
import { onAuthChanged, signInWithGoogle, handleRedirectResult, doSignOut } from "@/lib/firebase";

interface AuthState {
  user: User | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Handle the redirect result from Google Sign-In (signInWithRedirect flow)
    handleRedirectResult().then(() => {
      unsubscribe = onAuthChanged((user) => {
        setState({ user, loading: false });
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  const signIn = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    await doSignOut();
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    signIn,
    signOut,
    isAuthenticated: !!state.user,
  };
}
