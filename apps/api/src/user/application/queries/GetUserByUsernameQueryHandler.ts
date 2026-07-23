import { injectable, inject } from "tsyringe";
import { UserUsername } from "../../domain/value-objects/UserUsername.js";
import { DITOKEN_IUSER_REPOSITORY } from "../../domain/repositories/IUserRepository.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { GetUserByUsernameQuery } from "./GetUserByUsernameQuery.js";
import { UserResponseDTO } from "../dto/UserResponseDTO.js";
import { UserMapper } from "../mappers/UserMapper.js";
import { UserNotFoundException } from "../../domain/exceptions/UserNotFoundException.js";

@injectable()
export class GetUserByUsernameQueryHandler {
  constructor(@inject(DITOKEN_IUSER_REPOSITORY) private readonly userRepository: IUserRepository) {}

  async execute(query: GetUserByUsernameQuery): Promise<UserResponseDTO> {
    const username = new UserUsername(query.username);
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new UserNotFoundException(query.username);
    }

    return UserMapper.toResponse(user);
  }
}
