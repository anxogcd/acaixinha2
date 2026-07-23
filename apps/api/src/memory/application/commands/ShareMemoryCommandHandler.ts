import { injectable, inject } from "tsyringe";
import { Memory } from "../../domain/models/Memory.js";
import { MemoryId } from "../../domain/value-objects/MemoryId.js";
import { DITOKEN_IMEMORY_REPOSITORY } from "../../domain/repositories/IMemoryRepository.js";
import type { IMemoryRepository } from "../../domain/repositories/IMemoryRepository.js";
import { DITOKEN_IUSER_REPOSITORY } from "../../../user/domain/repositories/IUserRepository.js";
import type { IUserRepository } from "../../../user/domain/repositories/IUserRepository.js";
import { UserId } from "../../../user/domain/value-objects/UserId.js";
import { DITOKEN_IEVENT_BUS } from "@acaixinha/shared";
import type { IEventBus } from "@acaixinha/shared";
import { MemorySharingService } from "../../domain/services/MemorySharingService.js";
import { ShareMemoryCommand } from "./ShareMemoryCommand.js";
import { MemoryNotFoundException } from "../../domain/exceptions/MemoryNotFoundException.js";
import { UnauthorizedMemoryAccessException } from "../../domain/exceptions/UnauthorizedMemoryAccessException.js";
import { UserNotFoundException } from "../../../user/domain/exceptions/UserNotFoundException.js";

@injectable()
export class ShareMemoryCommandHandler {
  private readonly sharingService = new MemorySharingService();

  constructor(
    @inject(DITOKEN_IMEMORY_REPOSITORY) private readonly memoryRepository: IMemoryRepository,
    @inject(DITOKEN_IUSER_REPOSITORY) private readonly userRepository: IUserRepository,
    @inject(DITOKEN_IEVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  async execute(command: ShareMemoryCommand): Promise<Memory> {
    const memory = await this.memoryRepository.findById(new MemoryId(command.memoryId));
    if (!memory) {
      throw new MemoryNotFoundException(command.memoryId);
    }

    if (!memory.isOwner(command.requestingUserId)) {
      throw new UnauthorizedMemoryAccessException(command.memoryId, command.requestingUserId);
    }

    const targetUser = await this.userRepository.findById(new UserId(command.targetUserId));
    if (!targetUser) {
      throw new UserNotFoundException(command.targetUserId);
    }

    this.sharingService.shareMemory(memory, targetUser);

    await this.memoryRepository.save(memory);
    await this.userRepository.save(targetUser);

    for (const event of memory.pullEvents()) {
      await this.eventBus.publish(event);
    }
    for (const event of targetUser.pullEvents()) {
      await this.eventBus.publish(event);
    }

    return memory;
  }
}
