import { injectable, inject } from "tsyringe";
import { User } from "../../domain/models/User.js";
import { UserId } from "../../domain/value-objects/UserId.js";
import { UserName } from "../../domain/value-objects/UserName.js";
import { UserUsername } from "../../domain/value-objects/UserUsername.js";
import { DITOKEN_IUSER_REPOSITORY } from "../../domain/repositories/IUserRepository.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { DITOKEN_IEVENT_BUS } from "@acaixinha/shared";
import type { IEventBus } from "@acaixinha/shared";
import { CreateUserCommand } from "./CreateUserCommand.js";
import { UserAlreadyExistsException } from "../../domain/exceptions/UserAlreadyExistsException.js";

@injectable()
export class CreateUserCommandHandler {
  constructor(
    @inject(DITOKEN_IUSER_REPOSITORY) private readonly userRepository: IUserRepository,
    @inject(DITOKEN_IEVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const username = new UserUsername(command.username);

    const existing = await this.userRepository.findByUsername(username);
    if (existing) {
      throw new UserAlreadyExistsException(command.username);
    }

    const user = User.create({
      id: new UserId(command.id),
      name: new UserName(command.name),
      username,
    });

    await this.userRepository.save(user);

    for (const event of user.pullEvents()) {
      await this.eventBus.publish(event);
    }

    return user;
  }
}
