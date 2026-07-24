import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "../../stores/uiStore";
import { useMemoryStore } from "../../stores/memoryStore";
import { apiPost } from "../../lib/api/client";
import type { UploadUrlResponse } from "@acaixinha/shared";
import { Upload, Loader2 } from "lucide-react";

interface AttachmentUploaderProps {
  memoryId: string;
}

export function AttachmentUploader({ memoryId }: AttachmentUploaderProps) {
  const { t } = useTranslation();
  const addToast = useUiStore((s) => s.addToast);
  const fetchMemory = useMemoryStore((s) => s.fetchMemory);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ALLOWED_MIMES = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "audio/mpeg",
      "audio/ogg",
      "application/pdf",
    ];

    if (!ALLOWED_MIMES.includes(file.type)) {
      addToast({
        title: t("attachments.uploadError"),
        description: `MIME type ${file.type} not allowed`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const { uploadUrl, attachmentId, s3Key } = await apiPost<UploadUrlResponse>(
        `/memories/${memoryId}/upload-url`,
        { mimeType: file.type },
      );

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed with status ${xhr.status}`));
        });
        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      await apiPost(
        `/memories/${memoryId}/attachments/${attachmentId}/confirm`,
        {
          mimeType: file.type,
          description: "",
        },
      );

      addToast({ title: t("attachments.uploadSuccess") });
      await fetchMemory(memoryId);
    } catch (err) {
      addToast({
        title: t("attachments.uploadError"),
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept="image/*,video/*,audio/*,application/pdf"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("attachments.uploading")} {progress}%
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            {t("attachments.addAttachment")}
          </>
        )}
      </button>
      {isUploading && progress > 0 && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}