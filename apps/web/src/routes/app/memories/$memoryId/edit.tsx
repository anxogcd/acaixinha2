import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMemoryStore } from "../../../../stores/memoryStore";
import { MemoryForm } from "../../../../components/memories/MemoryForm";
import { Skeleton } from "../../../../components/ui/skeleton";

export const Route = createFileRoute("/app/memories/$memoryId/edit")({
  component: EditMemoryPage,
});

function EditMemoryPage() {
  const { t } = useTranslation();
  const { memoryId } = Route.useParams();
  const navigate = useNavigate();
  const memory = useMemoryStore((s) => s.currentMemory);
  const fetchMemory = useMemoryStore((s) => s.fetchMemory);
  const isLoading = useMemoryStore((s) => s.isLoading);

  useEffect(() => {
    fetchMemory(memoryId);
  }, [memoryId, fetchMemory]);

  if (isLoading || !memory) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("memories.editMemory")}</h1>
      <MemoryForm
        mode="edit"
        memory={memory}
        onSuccess={() =>
          navigate({ to: "/app/memories/$memoryId", params: { memoryId } })
        }
      />
    </div>
  );
}