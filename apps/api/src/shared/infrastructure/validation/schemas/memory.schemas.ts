import { z } from "zod";

const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const createMemorySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(10000),
  memoryDate: z.string().datetime(),
  locationName: z.string().max(200).optional(),
  coordinates: coordinatesSchema.optional(),
  tags: z.array(z.string().regex(/^[a-z0-9_-]+$/).max(50)).optional(),
});

export const updateMemorySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(10000).optional(),
  memoryDate: z.string().datetime().optional(),
  locationName: z.string().max(200).nullable().optional(),
  coordinates: coordinatesSchema.nullable().optional(),
  tags: z.array(z.string().regex(/^[a-z0-9_-]+$/).max(50)).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

export const shareMemorySchema = z.object({
  targetUserId: z.string().uuid(),
});

export const addAttachmentSchema = z.object({
  s3Key: z.string().min(1),
  mimeType: z.string().min(1),
  description: z.string().max(500).optional(),
});

export const searchMemoriesSchema = z.object({
  text: z.string().optional(),
  tags: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});