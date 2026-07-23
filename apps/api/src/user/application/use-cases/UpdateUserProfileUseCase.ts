import { injectable, inject } from "tsyringe";
import { UpdateUserProfileCommand } from "../commands/UpdateUserProfileCommand.js";
import { UpdateUserProfileCommandHandler } from "../commands/UpdateUserProfileCommandHandler.js";
import { UserResponseDTO } from "../dto/UserResponseDTO.js";
import { UserMapper } from "../mappers/UserMapper.js";

@injectable()
export class UpdateUserProfileUseCase {
  constructor(
    @inject(UpdateUserProfileCommandHandler)
    private readonly handler: UpdateUserProfileCommandHandler,
  ) {}

  async execute(
    userId: string,
    name?: string,
    avatarUrl?: string,
    description?: string,
  ): Promise<UserResponseDTO> {
    const command = new UpdateUserProfileCommand(userId, name, avatarUrl, description);
    const user = await this.handler.execute(command);
    return UserMapper.toResponse(user);
  }
}
