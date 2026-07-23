import { Memory } from "../../domain/models/Memory.js";
import type { Attachment } from "../../domain/models/Attachment.js";
import { MemoryId } from "../../domain/value-objects/MemoryId.js";
import { MemoryTitle } from "../../domain/value-objects/MemoryTitle.js";
import { MemoryDescription } from "../../domain/value-objects/MemoryDescription.js";
import { LocationName } from "../../domain/value-objects/LocationName.js";
import { Coordinates } from "../../domain/value-objects/Coordinates.js";
import { Tag } from "../../domain/value-objects/Tag.js";
import type { CreateMemoryDTO } from "../dto/CreateMemoryDTO.js";
import type { MemoryResponseDTO, AttachmentResponseDTO } from "../dto/MemoryResponseDTO.js";

export class MemoryMapper {
  static toDomain(dto: CreateMemoryDTO, ownerId: string, id: string): Memory {
    const tags = dto.tags?.map((t) => new Tag(t)) ?? [];
    const locationName = dto.locationName ? new LocationName(dto.locationName) : null;
    const coordinates = dto.coordinates
      ? new Coordinates(dto.coordinates.latitude, dto.coordinates.longitude)
      : null;

    return Memory.create({
      id: new MemoryId(id),
      title: new MemoryTitle(dto.title),
      description: new MemoryDescription(dto.description),
      memoryDate: new Date(dto.memoryDate),
      locationName,
      coordinates,
      ownerId,
      tags,
    });
  }

  static toResponse(memory: Memory): MemoryResponseDTO {
    return {
      id: memory.id.value,
      title: memory.title.value,
      description: memory.description.value,
      memoryDate: memory.memoryDate.toISOString(),
      locationName: memory.locationName?.value ?? null,
      coordinates: memory.coordinates
        ? { latitude: memory.coordinates.latitude, longitude: memory.coordinates.longitude }
        : null,
      ownerId: memory.ownerId,
      tags: memory.tags.map((t) => t.value),
      sharedWithUserIds: Array.from(memory.sharedWithUserIds),
      attachments: memory.attachments.map((a) => MemoryMapper.attachmentToResponse(a)),
      createdAt: memory.createdAt.toISOString(),
      updatedAt: memory.updatedAt.toISOString(),
    };
  }

  static attachmentToResponse(attachment: Attachment): AttachmentResponseDTO {
    return {
      id: attachment.id.value,
      s3Key: attachment.s3Key.value,
      mimeType: attachment.mimeType.value,
      description: attachment.description?.value ?? null,
      uploadedByUserId: attachment.uploadedByUserId,
      uploadedAt: attachment.uploadedAt.toISOString(),
    };
  }
}
