import type { UserEntity } from "../entities/UserEntity.js";
import { User } from "../../domain/models/User.js";
import { UserId } from "../../domain/value-objects/UserId.js";
import { UserName } from "../../domain/value-objects/UserName.js";
import { UserUsername } from "../../domain/value-objects/UserUsername.js";
import { UserAvatarUrl } from "../../domain/value-objects/UserAvatarUrl.js";
import { UserDescription } from "../../domain/value-objects/UserDescription.js";

export class UserMapper {
  static toDomain(entity: UserEntity): User {
    const user = User.create({
      id: new UserId(entity.id),
      name: new UserName(entity.name),
      username: new UserUsername(entity.username),
      avatarUrl: entity.avatarUrl ? new UserAvatarUrl(entity.avatarUrl) : null,
      description: entity.description ? new UserDescription(entity.description) : null,
    });

    Object.defineProperty(user, "createdAt", {
      value: new Date(entity.createdAt),
    });
    user.updatedAt = new Date(entity.updatedAt);
    user.ownMemoryIds = new Set(entity.ownMemoryIds);
    user.sharedMemoryIds = new Set(entity.sharedMemoryIds);
    user.pullEvents();

    return user;
  }

  static toPersistence(user: User): UserEntity {
    return {
      id: user.id.value,
      name: user.name.value,
      username: user.username.value,
      avatarUrl: user.avatarUrl?.value ?? null,
      description: user.description?.value ?? null,
      ownMemoryIds: Array.from(user.ownMemoryIds),
      sharedMemoryIds: Array.from(user.sharedMemoryIds),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
