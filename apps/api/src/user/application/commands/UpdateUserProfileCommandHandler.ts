import { injectable, inject } from "tsyringe";
import { User } from "../../domain/models/User.js";
import { UserId } from "../../domain/value-objects/UserId.js";
import { UserName } from "../../domain/value-objects/UserName.js";
import { UserAvatarUrl } from "../../domain/value-objects/UserAvatarUrl.js";
import { UserDescription } from "../../domain/value-objects/UserDescription.js";
import { DITOKEN_IUSER_REPOSITORY } from "../../domain/repositories/IUserRepository.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { DITOKEN_IEVENT_BUS } from "@acaixinha/shared";
import type { IEventBus } from "@acaixinha/shared";
import { UpdateUserProfileCommand } from "./UpdateUserProfileCommand.js";
import { UserNotFoundException } from "../../domain/exceptions/UserNotFoundException.js";

@injectable()
export class UpdateUserProfileCommandHandler {
  constructor(
    @inject(DITOKEN_IUSER_REPOSITORY) private readonly userRepository: IUserRepository,
    @inject(DITOKEN_IEVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  async execute(command: UpdateUserProfileCommand): Promise<User> {
    const userId = new UserId(command.userId);
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    const name = command.name !== undefined ? new UserName(command.name) : user.name;
    const avatarUrl =
      command.avatarUrl !== undefined ? new UserAvatarUrl(command.avatarUrl) : user.avatarUrl;
    const description =
      command.description !== undefined
        ? new UserDescription(command.description)
        : user.description;

    user.updateProfile(name, avatarUrl, description);

    await this.userRepository.save(user);

    for (const event of user.pullEvents()) {
      await this.eventBus.publish(event);
    }

    return user;
  }
}
