import { injectable } from "tsyringe";

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/ogg",
  "application/pdf",
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

@injectable()
export class FileValidator {
  isMimeTypeAllowed(mimeType: string): boolean {
    return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
  }

  getAllowedMimeTypes(): readonly string[] {
    return ALLOWED_MIME_TYPES;
  }
}
