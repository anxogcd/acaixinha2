import { describe, it, expect } from "vitest";
import { Memory } from "../models/Memory.js";
import { MemoryId } from "../value-objects/MemoryId.js";
import { MemoryTitle } from "../value-objects/MemoryTitle.js";
import { MemoryDescription } from "../value-objects/MemoryDescription.js";
import { Tag } from "../value-objects/Tag.js";
import { Coordinates } from "../value-objects/Coordinates.js";
import { Attachment } from "../models/Attachment.js";
import { AttachmentId } from "../value-objects/AttachmentId.js";
import { S3Key } from "../value-objects/S3Key.js";
import { MimeType } from "../value-objects/MimeType.js";
import { LocationName } from "../value-objects/LocationName.js";
import { MemoryCreatedEvent } from "../events/MemoryCreatedEvent.js";
import { MemoryUpdatedEvent } from "../events/MemoryUpdatedEvent.js";
import { MemoryDeletedEvent } from "../events/MemoryDeletedEvent.js";
import { MemorySharedEvent } from "../events/MemorySharedEvent.js";
import { AttachmentAddedEvent } from "../events/AttachmentAddedEvent.js";
import { AttachmentLimitExceededException } from "../exceptions/AttachmentLimitExceededException.js";
import { UnauthorizedMemoryAccessException } from "../exceptions/UnauthorizedMemoryAccessException.js";
import { MAX_ATTACHMENTS_PER_MEMORY } from "../constants/index.js";

const ownerId = "user-1";
const memoryId = new MemoryId("880e8400-e29b-41d4-a716-446655440003");

describe("Memory aggregate", () => {
  it("creates memory and records MemoryCreatedEvent", () => {
    const memory = Memory.create({
      id: memoryId,
      title: new MemoryTitle("Test Memory"),
      description: new MemoryDescription("A test memory"),
      memoryDate: new Date("2024-01-15"),
      locationName: null,
      coordinates: null,
      ownerId,
    });

    expect(memory.id.equals(memoryId)).toBe(true);
    expect(memory.title.value).toBe("Test Memory");
    expect(memory.description.value).toBe("A test memory");
    expect(memory.ownerId).toBe(ownerId);
    expect(memory.tags.length).toBe(0);
    expect(memory.sharedWithUserIds.size).toBe(0);
    expect(memory.attachments).toHaveLength(0);

    const events = memory.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(MemoryCreatedEvent);
  });

  it("creates memory with optional location and coordinates", () => {
    const memory = Memory.create({
      id: memoryId,
      title: new MemoryTitle("Location Memory"),
      description: new MemoryDescription("With location"),
      memoryDate: new Date(),
      ownerId,
      locationName: new LocationName("Santiago"),
      coordinates: new Coordinates(42.8782, -8.5448),
    });

    expect(memory.locationName?.value).toBe("Santiago");
    expect(memory.coordinates?.latitude).toBe(42.8782);
    expect(memory.coordinates?.longitude).toBe(-8.5448);
  });

  it("isOwner returns true for owner", () => {
    const memory = createMemory();
    expect(memory.isOwner(ownerId)).toBe(true);
  });

  it("isOwner returns false for non-owner", () => {
    const memory = createMemory();
    expect(memory.isOwner("other-user")).toBe(false);
  });

  it("isSharedWith returns true for shared user", () => {
    const memory = createMemory();
    memory.shareWithUser("user-2");
    expect(memory.isSharedWith("user-2")).toBe(true);
  });

  it("isSharedWith returns false for non-shared user", () => {
    const memory = createMemory();
    expect(memory.isSharedWith("user-3")).toBe(false);
  });

  it("canUserAddAttachment returns true for owner", () => {
    const memory = createMemory();
    expect(memory.canUserAddAttachment(ownerId)).toBe(true);
  });

  it("canUserAddAttachment returns true for shared user", () => {
    const memory = createMemory();
    memory.shareWithUser("user-2");
    expect(memory.canUserAddAttachment("user-2")).toBe(true);
  });

  it("canUserAddAttachment returns false for unauthorized user", () => {
    const memory = createMemory();
    expect(memory.canUserAddAttachment("stranger")).toBe(false);
  });

  it("updateDetails records MemoryUpdatedEvent", () => {
    const memory = createMemory();
    memory.pullEvents();

    memory.updateDetails({
      title: new MemoryTitle("Updated Title"),
    });

    const events = memory.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(MemoryUpdatedEvent);
    expect(memory.title.value).toBe("Updated Title");
    expect(memory.description.value).toBe("A test memory");
  });

  it("addTag and removeTag manage tags array", () => {
    const memory = createMemory();
    const tag = new Tag("vacaciones");

    memory.addTag(tag);
    expect(memory.tags.some((t: Tag) => t.equals(tag))).toBe(true);
    expect(memory.tags.length).toBe(1);

    memory.removeTag(tag);
    expect(memory.tags.length).toBe(0);
  });

  it("shareWithUser records MemorySharedEvent", () => {
    const memory = createMemory();
    memory.pullEvents();

    memory.shareWithUser("user-2");
    expect(memory.sharedWithUserIds.has("user-2")).toBe(true);

    const events = memory.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(MemorySharedEvent);
  });

  it("unshareWithUser removes shared user", () => {
    const memory = createMemory();
    memory.shareWithUser("user-2");
    memory.pullEvents();

    memory.unshareWithUser("user-2");
    expect(memory.sharedWithUserIds.has("user-2")).toBe(false);
  });

  it("addAttachment records AttachmentAddedEvent", () => {
    const memory = createMemory();
    memory.pullEvents();

    const attachment = Attachment.create({
      id: new AttachmentId("990e8400-e29b-41d4-a716-446655440004"),
      s3Key: new S3Key("memories/mem-1/att-1.jpg"),
      mimeType: new MimeType("image/jpeg"),
      description: null,
      uploadedByUserId: ownerId,
    });

    memory.addAttachment(attachment);
    expect(memory.attachments).toHaveLength(1);
    expect(memory.attachments[0].id.equals(attachment.id)).toBe(true);

    const events = memory.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(AttachmentAddedEvent);
  });

  it("delete records MemoryDeletedEvent when called by owner", () => {
    const memory = createMemory();
    memory.pullEvents();

    memory.delete(ownerId);
    const events = memory.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(MemoryDeletedEvent);
  });

  it("delete throws for non-owner", () => {
    const memory = createMemory();
    expect(() => memory.delete("other-user")).toThrow(UnauthorizedMemoryAccessException);
  });

  it("removeAttachment succeeds for owner", () => {
    const memory = createMemory();
    const attId = new AttachmentId("aa0e8400-e29b-41d4-a716-446655440005");
    const attachment = Attachment.create({
      id: attId,
      s3Key: new S3Key("memories/mem-1/att-1.jpg"),
      mimeType: new MimeType("image/jpeg"),
      description: null,
      uploadedByUserId: ownerId,
    });
    memory.addAttachment(attachment);
    memory.pullEvents();

    memory.removeAttachment(attId, ownerId);
    expect(memory.attachments).toHaveLength(0);
  });

  it("removeAttachment succeeds for uploader (non-owner)", () => {
    const memory = createMemory();
    const attId = new AttachmentId("bb0e8400-e29b-41d4-a716-446655440006");
    const attachment = Attachment.create({
      id: attId,
      s3Key: new S3Key("memories/mem-1/att-1.jpg"),
      mimeType: new MimeType("image/jpeg"),
      description: null,
      uploadedByUserId: "user-2",
    });
    memory.addAttachment(attachment);
    memory.pullEvents();

    memory.removeAttachment(attId, "user-2");
    expect(memory.attachments).toHaveLength(0);
  });

  it("removeAttachment throws for non-owner non-uploader", () => {
    const memory = createMemory();
    const attId = new AttachmentId("cc0e8400-e29b-41d4-a716-446655440007");
    const attachment = Attachment.create({
      id: attId,
      s3Key: new S3Key("memories/mem-1/att-1.jpg"),
      mimeType: new MimeType("image/jpeg"),
      description: null,
      uploadedByUserId: ownerId,
    });
    memory.addAttachment(attachment);

    expect(() => memory.removeAttachment(attId, "stranger")).toThrow(
      UnauthorizedMemoryAccessException,
    );
  });

  it("addAttachment throws when limit exceeded", () => {
    const memory = createMemory();
    for (let i = 0; i < MAX_ATTACHMENTS_PER_MEMORY; i++) {
      const hex = i.toString(16).padStart(2, "0");
      const att = Attachment.create({
        id: new AttachmentId(`11${hex}e840-e29b-41d4-a716-446655440000`),
        s3Key: new S3Key(`memories/mem-1/att-${i}.jpg`),
        mimeType: new MimeType("image/jpeg"),
        description: null,
        uploadedByUserId: ownerId,
      });
      memory.addAttachment(att);
    }

    const extra = Attachment.create({
      id: new AttachmentId("12ee8400-e29b-41d4-a716-446655440000"),
      s3Key: new S3Key("memories/mem-1/att-extra.jpg"),
      mimeType: new MimeType("image/jpeg"),
      description: null,
      uploadedByUserId: ownerId,
    });
    expect(() => memory.addAttachment(extra)).toThrow(AttachmentLimitExceededException);
  });
});

function createMemory(): Memory {
  return Memory.create({
    id: memoryId,
    title: new MemoryTitle("Test Memory"),
    description: new MemoryDescription("A test memory"),
    memoryDate: new Date("2024-01-15"),
    locationName: null,
    coordinates: null,
    ownerId,
  });
}