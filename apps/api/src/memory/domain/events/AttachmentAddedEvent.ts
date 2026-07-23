import { DomainEvent } from "@acaixinha/shared";
import { MemoryDomainEvents } from "../constants/index.js";

export class AttachmentAddedEvent extends DomainEvent {
  readonly eventType = MemoryDomainEvents.ATTACHMENT_ADDED;
  readonly memoryId: string;
  readonly attachmentId: string;
  readonly uploadedByUserId: string;

  constructor(payload: { memoryId: string; attachmentId: string; uploadedByUserId: string }) {
    super(payload.memoryId);
    this.memoryId = payload.memoryId;
    this.attachmentId = payload.attachmentId;
    this.uploadedByUserId = payload.uploadedByUserId;
  }
}
