import { useAuth } from "@/hooks/useAuth";
import { LoginGate } from "./dashboard/LoginGate";

export function LoginPage() {
  const { signIn } = useAuth();
  return <LoginGate onSignIn={signIn} />;
}
