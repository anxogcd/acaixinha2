import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { MemoryDTO } from "@acaixinha/shared";
import { useAuthStore } from "../../stores/authStore";
import { useMemoryStore } from "../../stores/memoryStore";
import { useUiStore } from "../../stores/uiStore";
import { Calendar, MapPin, Pencil, Trash2, Share2, Loader2 } from "lucide-react";

interface MemoryDetailProps {
  memory: MemoryDTO;
}

export function MemoryDetail({ memory }: MemoryDetailProps) {
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.user?.id);
  const deleteMemory = useMemoryStore((s) => s.deleteMemory);
  const addToast = useUiStore((s) => s.addToast);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = userId === memory.ownerId;
  const date = new Date(memory.memoryDate);

  const handleDelete = async () => {
    if (!confirm(t("memories.deleteConfirm"))) return;
    setIsDeleting(true);
    try {
      await deleteMemory(memory.id);
      addToast({ title: t("memories.memoryDeleted") });
    } catch (err) {
      addToast({
        title: t("common.error"),
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{memory.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {date.toLocaleDateString()}
          </span>
          {memory.locationName && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {memory.locationName}
            </span>
          )}
        </div>
      </div>

      <p className="whitespace-pre-wrap text-muted-foreground">
        {memory.description}
      </p>

      {memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {memory.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-3 py-1 text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {isOwner && (
        <div className="flex gap-2">
          <Link
            to="/app/memories/$memoryId/edit"
            params={{ memoryId: memory.id }}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            <Pencil className="h-4 w-4" />
            {t("common.edit")}
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {t("common.delete")}
          </button>
          <button
            onClick={() => {
              // Sharing dialog will be wired in the route page
              document.dispatchEvent(
                new CustomEvent("open-share-dialog", { detail: memory.id }),
              );
            }}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            <Share2 className="h-4 w-4" />
            {t("sharing.share")}
          </button>
        </div>
      )}

      {!isOwner && memory.sharedWithUserIds.includes(userId ?? "") && (
        <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
          Este recordo foi compartido contigo
        </div>
      )}

      {memory.coordinates && (
        <div className="rounded-md bg-muted/50 p-3 text-sm">
          <span className="font-medium">{t("memories.coordinates")}:</span>{" "}
          {memory.coordinates.latitude}, {memory.coordinates.longitude}
        </div>
      )}
    </article>
  );
}