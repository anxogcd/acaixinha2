import { DomainEvent } from "@acaixinha/shared";
import { UserDomainEvents } from "../constants/index.js";

interface UserProfileUpdatedEventPayload {
  userId: string;
  changes: {
    name?: string;
    avatarUrl?: string | null;
    description?: string | null;
  };
}

export class UserProfileUpdatedEvent extends DomainEvent {
  readonly eventType = UserDomainEvents.USER_PROFILE_UPDATED;
  readonly userId: string;
  readonly changes: {
    name?: string;
    avatarUrl?: string | null;
    description?: string | null;
  };

  constructor(payload: UserProfileUpdatedEventPayload) {
    super(payload.userId);
    this.userId = payload.userId;
    this.changes = payload.changes;
  }
}
