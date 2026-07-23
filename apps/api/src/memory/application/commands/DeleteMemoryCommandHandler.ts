import { injectable, inject } from "tsyringe";
import { MemoryId } from "../../domain/value-objects/MemoryId.js";
import { DITOKEN_IMEMORY_REPOSITORY } from "../../domain/repositories/IMemoryRepository.js";
import type { IMemoryRepository } from "../../domain/repositories/IMemoryRepository.js";
import { DITOKEN_IUSER_REPOSITORY } from "../../../user/domain/repositories/IUserRepository.js";
import type { IUserRepository } from "../../../user/domain/repositories/IUserRepository.js";
import { UserId } from "../../../user/domain/value-objects/UserId.js";
import { DITOKEN_IEVENT_BUS } from "@acaixinha/shared";
import type { IEventBus } from "@acaixinha/shared";
import { DeleteMemoryCommand } from "./DeleteMemoryCommand.js";
import { MemoryNotFoundException } from "../../domain/exceptions/MemoryNotFoundException.js";
import { UnauthorizedMemoryAccessException } from "../../domain/exceptions/UnauthorizedMemoryAccessException.js";

@injectable()
export class DeleteMemoryCommandHandler {
  constructor(
    @inject(DITOKEN_IMEMORY_REPOSITORY) private readonly memoryRepository: IMemoryRepository,
    @inject(DITOKEN_IUSER_REPOSITORY) private readonly userRepository: IUserRepository,
    @inject(DITOKEN_IEVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  async execute(command: DeleteMemoryCommand): Promise<void> {
    const memory = await this.memoryRepository.findById(new MemoryId(command.memoryId));
    if (!memory) {
      throw new MemoryNotFoundException(command.memoryId);
    }

    if (!memory.isOwner(command.requestingUserId)) {
      throw new UnauthorizedMemoryAccessException(command.memoryId, command.requestingUserId);
    }

    memory.delete(command.requestingUserId);

    // Clean up owner's ownMemoryIds
    const owner = await this.userRepository.findById(new UserId(memory.ownerId));
    if (owner) {
      owner.removeOwnMemory(memory.id.value);
      await this.userRepository.save(owner);
    }

    // Clean up sharedMemoryIds for all shared users
    for (const sharedUserId of memory.sharedWithUserIds) {
      const sharedUser = await this.userRepository.findById(new UserId(sharedUserId));
      if (sharedUser) {
        sharedUser.removeSharedMemory(memory.id.value);
        await this.userRepository.save(sharedUser);
      }
    }

    await this.memoryRepository.delete(new MemoryId(command.memoryId));

    for (const event of memory.pullEvents()) {
      await this.eventBus.publish(event);
    }
  }
}
