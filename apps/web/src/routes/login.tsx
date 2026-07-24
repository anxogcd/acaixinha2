import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getAuthUrl } from "../lib/cognito";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  useEffect(() => {
    window.location.href = getAuthUrl();
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">Redirecting to login...</p>
    </div>
  );
}