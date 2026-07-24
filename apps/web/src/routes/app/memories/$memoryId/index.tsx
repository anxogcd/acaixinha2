import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMemoryStore } from "../../../../stores/memoryStore";
import { useAuthStore } from "../../../../stores/authStore";
import { MemoryDetail } from "../../../../components/memories/MemoryDetail";
import { AttachmentList } from "../../../../components/attachments/AttachmentList";
import { AttachmentUploader } from "../../../../components/attachments/AttachmentUploader";
import { SharedUsersList } from "../../../../components/sharing/SharedUsersList";
import { ShareMemoryDialog } from "../../../../components/sharing/ShareMemoryDialog";
import { Skeleton } from "../../../../components/ui/skeleton";

export const Route = createFileRoute("/app/memories/$memoryId/")({
  component: MemoryDetailPage,
});

function MemoryDetailPage() {
  const { t } = useTranslation();
  const { memoryId } = Route.useParams();
  const memory = useMemoryStore((s) => s.currentMemory);
  const isLoading = useMemoryStore((s) => s.isLoading);
  const error = useMemoryStore((s) => s.error);
  const fetchMemory = useMemoryStore((s) => s.fetchMemory);
  const unshareMemory = useMemoryStore((s) => s.unshareMemory);
  const userId = useAuthStore((s) => s.user?.id);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  useEffect(() => {
    fetchMemory(memoryId);
  }, [memoryId, fetchMemory]);

  useEffect(() => {
    const handler = () => setShareDialogOpen(true);
    document.addEventListener("open-share-dialog", handler);
    return () => document.removeEventListener("open-share-dialog", handler);
  }, []);

  if (isLoading || !memory) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <p className="text-destructive">{t("common.error")}</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => fetchMemory(memoryId)}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  const isOwner = userId === memory.ownerId;

  return (
    <div className="space-y-8">
      <MemoryDetail memory={memory} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("attachments.title")}</h2>
          <AttachmentUploader memoryId={memoryId} />
        </div>
        <AttachmentList attachments={memory.attachments} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("sharing.share")}</h2>
        <SharedUsersList
          sharedWithUserIds={memory.sharedWithUserIds}
          isOwner={isOwner}
          onUnshare={(userId) => unshareMemory(memory.id, userId)}
        />
      </div>

      <ShareMemoryDialog
        memoryId={memoryId}
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
      />
    </div>
  );
}