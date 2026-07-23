import { AggregateRoot } from "@acaixinha/shared";
import { UserId } from "../value-objects/UserId.js";
import { UserName } from "../value-objects/UserName.js";
import { UserUsername } from "../value-objects/UserUsername.js";
import { UserDescription } from "../value-objects/UserDescription.js";
import { UserAvatarUrl } from "../value-objects/UserAvatarUrl.js";
import { UserCreatedEvent } from "../events/UserCreatedEvent.js";
import { UserProfileUpdatedEvent } from "../events/UserProfileUpdatedEvent.js";
import { UserMemorySharedEvent } from "../events/UserMemorySharedEvent.js";

interface UserProps {
  name: UserName;
  username: UserUsername;
  avatarUrl?: UserAvatarUrl | null;
  description?: UserDescription | null;
}

interface CreateUserProps {
  id: UserId;
  name: UserName;
  username: UserUsername;
  avatarUrl?: UserAvatarUrl | null;
  description?: UserDescription | null;
}

export class User extends AggregateRoot<UserId> {
  readonly name: UserName;
  readonly username: UserUsername;
  avatarUrl: UserAvatarUrl | null;
  description: UserDescription | null;
  ownMemoryIds: Set<string>;
  sharedMemoryIds: Set<string>;

  private constructor(props: CreateUserProps) {
    super(props.id);
    this.name = props.name;
    this.username = props.username;
    this.avatarUrl = props.avatarUrl ?? null;
    this.description = props.description ?? null;
    this.ownMemoryIds = new Set();
    this.sharedMemoryIds = new Set();
  }

  static create(props: CreateUserProps): User {
    const user = new User(props);
    user.record(
      new UserCreatedEvent({
        userId: props.id.value,
        username: props.username.value,
        name: props.name.value,
      }),
    );
    return user;
  }

  updateProfile(
    name: UserName,
    avatarUrl: UserAvatarUrl | null,
    description: UserDescription | null,
  ): void {
    this.touch();
    const changes: {
      name?: string;
      avatarUrl?: string | null;
      description?: string | null;
    } = {};

    if (!this.name.equals(name)) {
      (this as { name: UserName }).name = name;
      changes.name = name.toString();
    }
    if (this.avatarUrl?.value !== avatarUrl?.value) {
      this.avatarUrl = avatarUrl;
      changes.avatarUrl = avatarUrl?.value ?? null;
    }
    if (this.description?.value !== description?.value) {
      this.description = description;
      changes.description = description?.value ?? null;
    }

    if (Object.keys(changes).length > 0) {
      this.record(
        new UserProfileUpdatedEvent({
          userId: this.id.value,
          changes,
        }),
      );
    }
  }

  addOwnMemory(memoryId: string): void {
    this.ownMemoryIds.add(memoryId);
    this.touch();
  }

  removeOwnMemory(memoryId: string): void {
    this.ownMemoryIds.delete(memoryId);
    this.touch();
  }

  addSharedMemory(memoryId: string, sharedByUserId: string): void {
    this.sharedMemoryIds.add(memoryId);
    this.touch();
    this.record(
      new UserMemorySharedEvent({
        userId: this.id.value,
        memoryId,
        sharedByUserId,
      }),
    );
  }

  removeSharedMemory(memoryId: string): void {
    this.sharedMemoryIds.delete(memoryId);
    this.touch();
  }
}
