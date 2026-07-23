import { injectable, inject } from "tsyringe";
import { UserId } from "../../domain/value-objects/UserId.js";
import { DITOKEN_IUSER_REPOSITORY } from "../../domain/repositories/IUserRepository.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { GetUserByIdQuery } from "./GetUserByIdQuery.js";
import { UserResponseDTO } from "../dto/UserResponseDTO.js";
import { UserMapper } from "../mappers/UserMapper.js";
import { UserNotFoundException } from "../../domain/exceptions/UserNotFoundException.js";

@injectable()
export class GetUserByIdQueryHandler {
  constructor(@inject(DITOKEN_IUSER_REPOSITORY) private readonly userRepository: IUserRepository) {}

  async execute(query: GetUserByIdQuery): Promise<UserResponseDTO> {
    const userId = new UserId(query.userId);
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(query.userId);
    }

    return UserMapper.toResponse(user);
  }
}
