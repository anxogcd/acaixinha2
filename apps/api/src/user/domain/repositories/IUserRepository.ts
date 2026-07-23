import type { User } from "../models/User.js";
import type { UserId } from "../value-objects/UserId.js";
import type { UserUsername } from "../value-objects/UserUsername.js";

export const DITOKEN_IUSER_REPOSITORY = Symbol("IUserRepository");

export interface IUserRepository {
  findById(id: UserId): Promise<User | null>;
  findByUsername(username: UserUsername): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: UserId): Promise<void>;
}
