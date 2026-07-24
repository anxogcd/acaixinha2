import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { exchangeCodeForTokens } from "../lib/cognito";
import { useAuthStore } from "../stores/authStore";

export const Route = createFileRoute("/callback")({
  component: CallbackPage,
});

function CallbackPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const errorParam = params.get("error");

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (!code) {
      setError("No authorization code received");
      return;
    }

    exchangeCodeForTokens(code)
      .then((tokens) => {
        setSession(tokens);
        navigate({ to: "/app/memories" });
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, [navigate, setSession]);

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">Authentication failed: {error}</p>
        <a href="/login" className="text-primary underline">
          Try again
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">Signing in...</p>
    </div>
  );
}