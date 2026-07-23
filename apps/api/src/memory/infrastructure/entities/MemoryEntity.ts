export interface AttachmentEntity {
  id: string;
  s3Key: string;
  mimeType: string;
  description: string | null;
  uploadedByUserId: string;
  uploadedAt: string;
}

export interface MemoryEntity {
  id: string;
  title: string;
  description: string;
  memoryDate: string;
  locationName: string | null;
  coordinates_lat: number | null;
  coordinates_lng: number | null;
  ownerId: string;
  tags: string[];
  sharedWithUserIds: string[];
  attachments: AttachmentEntity[];
  createdAt: string;
  updatedAt: string;
}

export interface MemoryShareEntity {
  userId: string;
  memoryId: string;
}
