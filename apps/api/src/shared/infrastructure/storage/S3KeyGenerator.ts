import { injectable } from "tsyringe";

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "application/pdf": "pdf",
};

@injectable()
export class S3KeyGenerator {
  generateMemoryAttachmentKey(memoryId: string, attachmentId: string, mimeType: string): string {
    const ext = MIME_TO_EXTENSION[mimeType] ?? "bin";
    return `memories/${memoryId}/${attachmentId}.${ext}`;
  }
}
