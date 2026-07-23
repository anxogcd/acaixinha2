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
import { DITOKEN_IUSER_REPOSITORY } from "../../../user/domain/repositories/IUserRepository.js";
import type { IUserRepository } from "../../../user/domain/repositories/IUserRepository.js";
import { UserId } from "../../../user/domain/value-objects/UserId.js";
import { DITOKEN_IEVENT_BUS } from "@acaixinha/shared";
import type { IEventBus } from "@acaixinha/shared";
import { DITOKEN_ID_GENERATOR } from "@acaixinha/shared";
import type { IIdGenerator } from "@acaixinha/shared";
import { CreateMemoryCommand } from "./CreateMemoryCommand.js";
import { UserNotFoundException } from "../../../user/domain/exceptions/UserNotFoundException.js";

@injectable()
export class CreateMemoryCommandHandler {
  constructor(
    @inject(DITOKEN_IMEMORY_REPOSITORY) private readonly memoryRepository: IMemoryRepository,
    @inject(DITOKEN_IUSER_REPOSITORY) private readonly userRepository: IUserRepository,
    @inject(DITOKEN_IEVENT_BUS) private readonly eventBus: IEventBus,
    @inject(DITOKEN_ID_GENERATOR) private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(command: CreateMemoryCommand): Promise<Memory> {
    const owner = await this.userRepository.findById(new UserId(command.ownerId));
    if (!owner) {
      throw new UserNotFoundException(command.ownerId);
    }

    const tags = command.tags?.map((t) => new Tag(t)) ?? [];
    const locationName = command.locationName ? new LocationName(command.locationName) : null;
    const coordinates = command.coordinates
      ? new Coordinates(command.coordinates.latitude, command.coordinates.longitude)
      : null;

    const memory = Memory.create({
      id: new MemoryId(this.idGenerator.generate()),
      title: new MemoryTitle(command.title),
      description: new MemoryDescription(command.description),
      memoryDate: new Date(command.memoryDate),
      locationName,
      coordinates,
      ownerId: command.ownerId,
      tags,
    });

    owner.addOwnMemory(memory.id.value);

    await this.memoryRepository.save(memory);
    await this.userRepository.save(owner);

    for (const event of memory.pullEvents()) {
      await this.eventBus.publish(event);
    }

    return memory;
  }
}
