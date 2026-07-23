import { injectable, inject } from "tsyringe";
import { UserId } from "../../domain/value-objects/UserId.js";
import { DITOKEN_IUSER_REPOSITORY } from "../../domain/repositories/IUserRepository.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { DeleteUserCommand } from "./DeleteUserCommand.js";
import { UserNotFoundException } from "../../domain/exceptions/UserNotFoundException.js";

@injectable()
export class DeleteUserCommandHandler {
  constructor(@inject(DITOKEN_IUSER_REPOSITORY) private readonly userRepository: IUserRepository) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    const userId = new UserId(command.userId);
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    await this.userRepository.delete(userId);
  }
}
