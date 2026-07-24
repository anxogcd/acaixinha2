import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "../../components/auth/AuthGuard";
import { AppLayout } from "../../components/layout/AppLayout";

export const Route = createFileRoute("/app/__layout")({
  component: AppLayoutWrapper,
});

function AppLayoutWrapper() {
  return (
    <AuthGuard>
      <AppLayout />
    </AuthGuard>
  );
}