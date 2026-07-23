import { DomainEvent } from "@acaixinha/shared";
import { MemoryDomainEvents } from "../constants/index.js";

export class MemoryUpdatedEvent extends DomainEvent {
  readonly eventType = MemoryDomainEvents.MEMORY_UPDATED;
  readonly memoryId: string;
  readonly changes: Record<string, unknown>;

  constructor(payload: { memoryId: string; changes: Record<string, unknown> }) {
    super(payload.memoryId);
    this.memoryId = payload.memoryId;
    this.changes = payload.changes;
  }
}
