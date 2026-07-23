export interface AddAttachmentDTO {
  memoryId: string;
  s3Key: string;
  mimeType: string;
  description?: string;
}
