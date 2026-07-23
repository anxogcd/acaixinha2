import { DomainEvent } from "@acaixinha/shared";
import { MemoryDomainEvents } from "../constants/index.js";

interface MemoryCreatedEventPayload {
  memoryId: string;
  ownerId: string;
  title: string;
}

export class MemoryCreatedEvent extends DomainEvent {
  readonly eventType = MemoryDomainEvents.MEMORY_CREATED;
  readonly memoryId: string;
  readonly ownerId: string;
  readonly title: string;

  constructor(payload: MemoryCreatedEventPayload) {
    super(payload.memoryId);
    this.memoryId = payload.memoryId;
    this.ownerId = payload.ownerId;
    this.title = payload.title;
  }
}
