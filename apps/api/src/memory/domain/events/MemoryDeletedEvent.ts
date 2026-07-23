import { DomainEvent } from "@acaixinha/shared";
import { MemoryDomainEvents } from "../constants/index.js";

export class MemoryDeletedEvent extends DomainEvent {
  readonly eventType = MemoryDomainEvents.MEMORY_DELETED;
  readonly memoryId: string;
  readonly ownerId: string;

  constructor(payload: { memoryId: string; ownerId: string }) {
    super(payload.memoryId);
    this.memoryId = payload.memoryId;
    this.ownerId = payload.ownerId;
  }
}
