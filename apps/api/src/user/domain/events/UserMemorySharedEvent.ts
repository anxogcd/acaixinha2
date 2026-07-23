import { DomainEvent } from "@acaixinha/shared";
import { UserDomainEvents } from "../constants/index.js";

interface UserMemorySharedEventPayload {
  userId: string;
  memoryId: string;
  sharedByUserId: string;
}

export class UserMemorySharedEvent extends DomainEvent {
  readonly eventType = UserDomainEvents.USER_MEMORY_SHARED;
  readonly userId: string;
  readonly memoryId: string;
  readonly sharedByUserId: string;

  constructor(payload: UserMemorySharedEventPayload) {
    super(payload.userId);
    this.userId = payload.userId;
    this.memoryId = payload.memoryId;
    this.sharedByUserId = payload.sharedByUserId;
  }
}
