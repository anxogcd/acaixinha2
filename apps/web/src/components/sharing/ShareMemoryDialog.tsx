import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMemoryStore } from "../../stores/memoryStore";
import { useUiStore } from "../../stores/uiStore";
import { apiGet } from "../../lib/api/client";
import type { UserDTO } from "@acaixinha/shared";
import { Search, X, Loader2 } from "lucide-react";

interface ShareMemoryDialogProps {
  memoryId: string;
  open: boolean;
  onClose: () => void;
}

export function ShareMemoryDialog({
  memoryId,
  open,
  onClose,
}: ShareMemoryDialogProps) {
  const { t } = useTranslation();
  const shareMemory = useMemoryStore((s) => s.shareMemory);
  const addToast = useUiStore((s) => s.addToast);

  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<UserDTO[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setResults([]);
    }
  }, [open]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    try {
      const user = await apiGet<UserDTO>(
        `/users?username=${encodeURIComponent(searchTerm.trim())}`,
      );
      setResults(user ? [user] : []);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleShare = async (userId: string) => {
    setIsSharing(true);
    try {
      await shareMemory(memoryId, userId);
      addToast({ title: t("sharing.memoryShared") });
      onClose();
    } catch (err) {
      addToast({
        title: t("common.error"),
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("sharing.shareWith")}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={t("sharing.searchByUsername")}
            className="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {results.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div>
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  @{user.username}
                </p>
              </div>
              <button
                onClick={() => handleShare(user.id)}
                disabled={isSharing}
                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
              >
                {t("sharing.share")}
              </button>
            </div>
          ))}
          {!isSearching && searchTerm && results.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t("common.noResults")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}