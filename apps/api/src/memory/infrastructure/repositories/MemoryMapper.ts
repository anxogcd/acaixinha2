import type { MemoryEntity, AttachmentEntity } from "../entities/MemoryEntity.js";
import { Memory } from "../../domain/models/Memory.js";
import { Attachment } from "../../domain/models/Attachment.js";
import { MemoryId } from "../../domain/value-objects/MemoryId.js";
import { MemoryTitle } from "../../domain/value-objects/MemoryTitle.js";
import { MemoryDescription } from "../../domain/value-objects/MemoryDescription.js";
import { LocationName } from "../../domain/value-objects/LocationName.js";
import { Coordinates } from "../../domain/value-objects/Coordinates.js";
import { Tag } from "../../domain/value-objects/Tag.js";
import { AttachmentId } from "../../domain/value-objects/AttachmentId.js";
import { S3Key } from "../../domain/value-objects/S3Key.js";
import { MimeType } from "../../domain/value-objects/MimeType.js";
import { AttachmentDescription } from "../../domain/value-objects/AttachmentDescription.js";

export class MemoryMapper {
  static toDomain(entity: MemoryEntity): Memory {
    const coordinates =
      entity.coordinates_lat !== null && entity.coordinates_lng !== null
        ? new Coordinates(entity.coordinates_lat, entity.coordinates_lng)
        : null;

    const memory = Memory.create({
      id: new MemoryId(entity.id),
      title: new MemoryTitle(entity.title),
      description: new MemoryDescription(entity.description),
      memoryDate: new Date(entity.memoryDate),
      locationName: entity.locationName ? new LocationName(entity.locationName) : null,
      coordinates,
      ownerId: entity.ownerId,
      tags: entity.tags.map((t) => new Tag(t)),
    });

    Object.defineProperty(memory, "createdAt", {
      value: new Date(entity.createdAt),
    });
    memory.updatedAt = new Date(entity.updatedAt);
    memory.sharedWithUserIds = new Set(entity.sharedWithUserIds);
    memory.attachments = entity.attachments.map((a) => MemoryMapper.attachmentToDomain(a));
    memory.pullEvents();

    return memory;
  }

  static toPersistence(memory: Memory): MemoryEntity {
    return {
      id: memory.id.value,
      title: memory.title.value,
      description: memory.description.value,
      memoryDate: memory.memoryDate.toISOString(),
      locationName: memory.locationName?.value ?? null,
      coordinates_lat: memory.coordinates?.latitude ?? null,
      coordinates_lng: memory.coordinates?.longitude ?? null,
      ownerId: memory.ownerId,
      tags: memory.tags.map((t) => t.value),
      sharedWithUserIds: Array.from(memory.sharedWithUserIds),
      attachments: memory.attachments.map((a) => MemoryMapper.attachmentToPersistence(a)),
      createdAt: memory.createdAt.toISOString(),
      updatedAt: memory.updatedAt.toISOString(),
    };
  }

  static attachmentToDomain(entity: AttachmentEntity): Attachment {
    const attachment = Attachment.create({
      id: new AttachmentId(entity.id),
      s3Key: new S3Key(entity.s3Key),
      mimeType: new MimeType(entity.mimeType),
      description: entity.description ? new AttachmentDescription(entity.description) : null,
      uploadedByUserId: entity.uploadedByUserId,
    });

    Object.defineProperty(attachment, "uploadedAt", {
      value: new Date(entity.uploadedAt),
    });

    return attachment;
  }

  static attachmentToPersistence(attachment: Attachment): AttachmentEntity {
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
