import { DomainEvent } from "@acaixinha/shared";
import { UserDomainEvents } from "../constants/index.js";

interface UserCreatedEventPayload {
  userId: string;
  username: string;
  name: string;
}

export class UserCreatedEvent extends DomainEvent {
  readonly eventType = UserDomainEvents.USER_CREATED;
  readonly userId: string;
  readonly username: string;
  readonly name: string;

  constructor(payload: UserCreatedEventPayload) {
    super(payload.userId);
    this.userId = payload.userId;
    this.username = payload.username;
    this.name = payload.name;
  }
}
