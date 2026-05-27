import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, Home, LogIn } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="max-w-md text-center">
        <AlertTriangle size={48} className="mx-auto mb-4 text-warning" />
        <h1 className="mb-2 text-2xl font-bold">Page Not Found</h1>
        <p className="mb-6 text-muted">
          The page you're looking for doesn't exist.
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={() => (window.location.hash = "#/view")} className="gap-2">
            <Home size={16} />
            Go Home
          </Button>
          <Button
            variant="secondary"
            onClick={() => (window.location.hash = "#/login")}
            className="gap-2"
          >
            <LogIn size={16} />
            Sign In
          </Button>
        </div>
      </Card>
    </div>
  );
}
