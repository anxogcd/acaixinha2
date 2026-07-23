import { User } from "../../domain/models/User.js";
import { UserId } from "../../domain/value-objects/UserId.js";
import { UserName } from "../../domain/value-objects/UserName.js";
import { UserUsername } from "../../domain/value-objects/UserUsername.js";
import { CreateUserDTO } from "../dto/CreateUserDTO.js";
import { UserResponseDTO } from "../dto/UserResponseDTO.js";

export class UserMapper {
  static toDomain(dto: CreateUserDTO): User {
    return User.create({
      id: new UserId(dto.id),
      name: new UserName(dto.name),
      username: new UserUsername(dto.username),
    });
  }

  static toResponse(user: User): UserResponseDTO {
    return {
      id: user.id.value,
      name: user.name.value,
      username: user.username.value,
      avatarUrl: user.avatarUrl?.value ?? null,
      description: user.description?.value ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
