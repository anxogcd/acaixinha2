import { AggregateRoot } from "@acaixinha/shared";
import { MemoryId } from "../value-objects/MemoryId.js";
import { MemoryTitle } from "../value-objects/MemoryTitle.js";
import { MemoryDescription } from "../value-objects/MemoryDescription.js";
import { LocationName } from "../value-objects/LocationName.js";
import { Coordinates } from "../value-objects/Coordinates.js";
import { Tag } from "../value-objects/Tag.js";
import { Attachment } from "./Attachment.js";
import { AttachmentId } from "../value-objects/AttachmentId.js";
import { MemoryCreatedEvent } from "../events/MemoryCreatedEvent.js";
import { MemoryUpdatedEvent } from "../events/MemoryUpdatedEvent.js";
import { MemoryDeletedEvent } from "../events/MemoryDeletedEvent.js";
import { MemorySharedEvent } from "../events/MemorySharedEvent.js";
import { AttachmentAddedEvent } from "../events/AttachmentAddedEvent.js";
import { MAX_ATTACHMENTS_PER_MEMORY } from "../constants/index.js";

interface CreateMemoryProps {
  id: MemoryId;
  title: MemoryTitle;
  description: MemoryDescription;
  memoryDate: Date;
  locationName: LocationName | null;
  coordinates: Coordinates | null;
  ownerId: string;
  tags?: Tag[];
}

interface UpdateMemoryProps {
  title?: MemoryTitle;
  description?: MemoryDescription;
  memoryDate?: Date;
  locationName?: LocationName | null;
  coordinates?: Coordinates | null;
  tags?: Tag[];
}

export class Memory extends AggregateRoot<MemoryId> {
  title: MemoryTitle;
  description: MemoryDescription;
  memoryDate: Date;
  locationName: LocationName | null;
  coordinates: Coordinates | null;
  readonly ownerId: string;
  tags: Tag[];
  sharedWithUserIds: Set<string>;
  attachments: Attachment[];

  private constructor(props: CreateMemoryProps) {
    super(props.id);
    this.title = props.title;
    this.description = props.description;
    this.memoryDate = props.memoryDate;
    this.locationName = props.locationName;
    this.coordinates = props.coordinates;
    this.ownerId = props.ownerId;
    this.tags = props.tags ?? [];
    this.sharedWithUserIds = new Set();
    this.attachments = [];
  }

  static create(props: CreateMemoryProps): Memory {
    const memory = new Memory(props);
    memory.record(
      new MemoryCreatedEvent({
        memoryId: props.id.value,
        ownerId: props.ownerId,
        title: props.title.value,
      }),
    );
    return memory;
  }

  updateDetails(props: UpdateMemoryProps): void {
    this.touch();
    const changes: Record<string, unknown> = {};

    if (props.title && !this.title.equals(props.title)) {
      this.title = props.title;
      changes.title = props.title.value;
    }
    if (props.description && !this.description.equals(props.description)) {
      this.description = props.description;
      changes.description = props.description.value;
    }
    if (props.memoryDate && this.memoryDate !== props.memoryDate) {
      this.memoryDate = props.memoryDate;
      changes.memoryDate = props.memoryDate.toISOString();
    }
    if (props.locationName !== undefined) {
      this.locationName = props.locationName;
      changes.locationName = props.locationName?.value ?? null;
    }
    if (props.coordinates !== undefined) {
      this.coordinates = props.coordinates;
      changes.coordinates = props.coordinates
        ? { lat: props.coordinates.latitude, lng: props.coordinates.longitude }
        : null;
    }
    if (props.tags) {
      this.tags = props.tags;
      changes.tags = props.tags.map((t) => t.value);
    }

    if (Object.keys(changes).length > 0) {
      this.record(
        new MemoryUpdatedEvent({
          memoryId: this.id.value,
          changes,
        }),
      );
    }
  }

  addTag(tag: Tag): void {
    this.tags.push(tag);
    this.touch();
  }

  removeTag(tag: Tag): void {
    this.tags = this.tags.filter((t) => !t.equals(tag));
    this.touch();
  }

  shareWithUser(userId: string): void {
    if (this.sharedWithUserIds.has(userId)) return;
    this.sharedWithUserIds.add(userId);
    this.touch();
    this.record(
      new MemorySharedEvent({
        memoryId: this.id.value,
        sharedWithUserId: userId,
        sharedByUserId: this.ownerId,
      }),
    );
  }

  unshareWithUser(userId: string): void {
    this.sharedWithUserIds.delete(userId);
    this.touch();
  }

  addAttachment(attachment: Attachment): void {
    if (this.attachments.length >= MAX_ATTACHMENTS_PER_MEMORY) {
      throw new Error(
        `Memory has reached the maximum of ${MAX_ATTACHMENTS_PER_MEMORY} attachments`,
      );
    }
    this.attachments.push(attachment);
    this.touch();
    this.record(
      new AttachmentAddedEvent({
        memoryId: this.id.value,
        attachmentId: attachment.id.value,
        uploadedByUserId: attachment.uploadedByUserId,
      }),
    );
  }

  removeAttachment(attachmentId: AttachmentId, requestingUserId: string): void {
    if (
      requestingUserId !== this.ownerId &&
      !this.attachments.some(
        (a) => a.id.equals(attachmentId) && a.uploadedByUserId === requestingUserId,
      )
    ) {
      throw new Error("Only the memory owner or the attachment uploader can remove it");
    }
    this.attachments = this.attachments.filter((a) => !a.id.equals(attachmentId));
    this.touch();
  }

  isOwner(userId: string): boolean {
    return this.ownerId === userId;
  }

  isSharedWith(userId: string): boolean {
    return this.sharedWithUserIds.has(userId);
  }

  canUserAddAttachment(userId: string): boolean {
    return this.isOwner(userId) || this.isSharedWith(userId);
  }

  delete(requestingUserId: string): void {
    if (!this.isOwner(requestingUserId)) {
      throw new Error("Only the memory owner can delete it");
    }
    this.record(
      new MemoryDeletedEvent({
        memoryId: this.id.value,
        ownerId: this.ownerId,
      }),
    );
  }
}
