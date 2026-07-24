import type { AttachmentResponseDTO } from "@acaixinha/shared";
import { AttachmentCard } from "./AttachmentCard";

interface AttachmentListProps {
  attachments: AttachmentResponseDTO[];
}

export function AttachmentList({ attachments }: AttachmentListProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
      {attachments.map((att) => (
        <AttachmentCard key={att.id} attachment={att} />
      ))}
    </div>
  );
}