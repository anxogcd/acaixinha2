export interface AttachmentResponseDTO {
  id: string;
  s3Key: string;
  mimeType: string;
  description: string | null;
  uploadedByUserId: string;
  uploadedAt: string;
}

export interface MemoryDTO {
  id: string;
  title: string;
  description: string;
  memoryDate: string;
  locationName: string | null;
  coordinates: { latitude: number; longitude: number } | null;
  ownerId: string;
  tags: string[];
  sharedWithUserIds: string[];
  attachments: AttachmentResponseDTO[];
  createdAt: string;
  updatedAt: string;
}