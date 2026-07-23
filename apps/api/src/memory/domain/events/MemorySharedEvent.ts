import { DomainEvent } from "@acaixinha/shared";
import { MemoryDomainEvents } from "../constants/index.js";

export class MemorySharedEvent extends DomainEvent {
  readonly eventType = MemoryDomainEvents.MEMORY_SHARED;
  readonly memoryId: string;
  readonly sharedWithUserId: string;
  readonly sharedByUserId: string;

  constructor(payload: { memoryId: string; sharedWithUserId: string; sharedByUserId: string }) {
    super(payload.memoryId);
    this.memoryId = payload.memoryId;
    this.sharedWithUserId = payload.sharedWithUserId;
    this.sharedByUserId = payload.sharedByUserId;
  }
}
