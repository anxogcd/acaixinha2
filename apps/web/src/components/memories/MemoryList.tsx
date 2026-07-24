import { useTranslation } from "react-i18next";
import { MemoryCard, MemoryCardSkeleton } from "./MemoryCard";
import type { MemoryDTO } from "@acaixinha/shared";
import { Inbox } from "lucide-react";

interface MemoryListProps {
  memories: MemoryDTO[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function MemoryList({ memories, isLoading, error, onRetry }: MemoryListProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <MemoryCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-destructive">{t("common.error")}</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={onRetry}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{t("memories.noMemories")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {memories.map((memory) => (
        <MemoryCard key={memory.id} memory={memory} />
      ))}
    </div>
  );
}