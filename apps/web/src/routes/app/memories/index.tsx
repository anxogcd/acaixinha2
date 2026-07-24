import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMemoryStore } from "../../../stores/memoryStore";
import { MemoryList } from "../../../components/memories/MemoryList";
import { MemorySearchBar } from "../../../components/memories/MemorySearchBar";

export const Route = createFileRoute("/app/memories/")({
  component: MemoriesFeedPage,
});

function MemoriesFeedPage() {
  const { t } = useTranslation();
  const memories = useMemoryStore((s) => s.memories);
  const isLoading = useMemoryStore((s) => s.isLoading);
  const error = useMemoryStore((s) => s.error);
  const fetchMemories = useMemoryStore((s) => s.fetchMemories);
  const searchMemories = useMemoryStore((s) => s.searchMemories);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("memories.title")}</h1>
      <MemorySearchBar onSearch={searchMemories} />
      <MemoryList
        memories={memories}
        isLoading={isLoading}
        error={error}
        onRetry={fetchMemories}
      />
    </div>
  );
}