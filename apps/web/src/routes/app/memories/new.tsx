import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { MemoryForm } from "../../../components/memories/MemoryForm";

export const Route = createFileRoute("/app/memories/new")({
  component: NewMemoryPage,
});

function NewMemoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("memories.createMemory")}</h1>
      <MemoryForm
        mode="create"
        onSuccess={() => navigate({ to: "/app/memories" })}
      />
    </div>
  );
}