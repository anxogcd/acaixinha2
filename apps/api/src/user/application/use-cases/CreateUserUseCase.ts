import { injectable, inject } from "tsyringe";
import { CreateUserCommand } from "../commands/CreateUserCommand.js";
import { CreateUserCommandHandler } from "../commands/CreateUserCommandHandler.js";
import { UserResponseDTO } from "../dto/UserResponseDTO.js";
import { UserMapper } from "../mappers/UserMapper.js";

@injectable()
export class CreateUserUseCase {
  constructor(
    @inject(CreateUserCommandHandler) private readonly handler: CreateUserCommandHandler,
  ) {}

  async execute(id: string, name: string, username: string): Promise<UserResponseDTO> {
    const command = new CreateUserCommand(id, name, username);
    const user = await this.handler.execute(command);
    return UserMapper.toResponse(user);
  }
}
