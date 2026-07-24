import type { AttachmentResponseDTO } from "@acaixinha/shared";
import { File, Image, Video, Music, FileText } from "lucide-react";

interface AttachmentCardProps {
  attachment: AttachmentResponseDTO;
}

function getMimeIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return Video;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType === "application/pdf") return FileText;
  return File;
}

function getMimeLabel(mimeType: string): string {
  const parts = mimeType.split("/");
  return parts[1]?.toUpperCase() ?? mimeType;
}

export function AttachmentCard({ attachment }: AttachmentCardProps) {
  const Icon = getMimeIcon(attachment.mimeType);

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border p-3 text-center hover:bg-accent/50 transition-colors">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <span className="text-xs font-medium">{getMimeLabel(attachment.mimeType)}</span>
      {attachment.description && (
        <span className="text-xs text-muted-foreground line-clamp-1">
          {attachment.description}
        </span>
      )}
      <span className="text-[10px] text-muted-foreground">
        {new Date(attachment.uploadedAt).toLocaleDateString()}
      </span>
    </div>
  );
}