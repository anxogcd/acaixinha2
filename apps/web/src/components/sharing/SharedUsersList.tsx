import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

interface SharedUsersListProps {
  sharedWithUserIds: string[];
  isOwner: boolean;
  onUnshare: (userId: string) => void;
}

export function SharedUsersList({
  sharedWithUserIds,
  isOwner,
  onUnshare,
}: SharedUsersListProps) {
  const { t } = useTranslation();

  if (sharedWithUserIds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("sharing.notShared")}</p>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{t("sharing.sharedWith")}</h3>
      <div className="flex flex-wrap gap-2">
        {sharedWithUserIds.map((userId) => (
          <span
            key={userId}
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm"
          >
            {userId.slice(0, 8)}...
            {isOwner && (
              <button
                onClick={() => onUnshare(userId)}
                className="rounded-full p-0.5 hover:bg-background"
                title={t("sharing.unshare")}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}