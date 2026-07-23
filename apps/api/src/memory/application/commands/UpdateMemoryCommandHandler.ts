import { injectable, inject } from "tsyringe";
import { Memory } from "../../domain/models/Memory.js";
import { MemoryId } from "../../domain/value-objects/MemoryId.js";
import { MemoryTitle } from "../../domain/value-objects/MemoryTitle.js";
import { MemoryDescription } from "../../domain/value-objects/MemoryDescription.js";
import { LocationName } from "../../domain/value-objects/LocationName.js";
import { Coordinates } from "../../domain/value-objects/Coordinates.js";
import { Tag } from "../../domain/value-objects/Tag.js";
import { DITOKEN_IMEMORY_REPOSITORY } from "../../domain/repositories/IMemoryRepository.js";
import type { IMemoryRepository } from "../../domain/repositories/IMemoryRepository.js";
import { DITOKEN_IEVENT_BUS } from "@acaixinha/shared";
import type { IEventBus } from "@acaixinha/shared";
import { UpdateMemoryCommand } from "./UpdateMemoryCommand.js";
import { MemoryNotFoundException } from "../../domain/exceptions/MemoryNotFoundException.js";
import { UnauthorizedMemoryAccessException } from "../../domain/exceptions/UnauthorizedMemoryAccessException.js";

@injectable()
export class UpdateMemoryCommandHandler {
  constructor(
    @inject(DITOKEN_IMEMORY_REPOSITORY) private readonly memoryRepository: IMemoryRepository,
    @inject(DITOKEN_IEVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  async execute(command: UpdateMemoryCommand): Promise<Memory> {
    const memory = await this.memoryRepository.findById(new MemoryId(command.memoryId));
    if (!memory) {
      throw new MemoryNotFoundException(command.memoryId);
    }

    if (!memory.isOwner(command.requestingUserId)) {
      throw new UnauthorizedMemoryAccessException(command.memoryId, command.requestingUserId);
    }

    memory.updateDetails({
      title: command.title !== undefined ? new MemoryTitle(command.title) : undefined,
      description:
        command.description !== undefined ? new MemoryDescription(command.description) : undefined,
      memoryDate: command.memoryDate !== undefined ? new Date(command.memoryDate) : undefined,
      locationName:
        command.locationName !== undefined ? new LocationName(command.locationName) : undefined,
      coordinates:
        command.coordinates !== undefined
          ? new Coordinates(command.coordinates.latitude, command.coordinates.longitude)
          : undefined,
      tags: command.tags !== undefined ? command.tags.map((t) => new Tag(t)) : undefined,
    });

    await this.memoryRepository.save(memory);

    for (const event of memory.pullEvents()) {
      await this.eventBus.publish(event);
    }

    return memory;
  }
}
