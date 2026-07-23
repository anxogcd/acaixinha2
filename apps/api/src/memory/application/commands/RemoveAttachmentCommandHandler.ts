import { injectable, inject } from "tsyringe";
import { Memory } from "../../domain/models/Memory.js";
import { MemoryId } from "../../domain/value-objects/MemoryId.js";
import { AttachmentId } from "../../domain/value-objects/AttachmentId.js";
import { DITOKEN_IMEMORY_REPOSITORY } from "../../domain/repositories/IMemoryRepository.js";
import type { IMemoryRepository } from "../../domain/repositories/IMemoryRepository.js";
import { DITOKEN_IEVENT_BUS } from "@acaixinha/shared";
import type { IEventBus } from "@acaixinha/shared";
import { RemoveAttachmentCommand } from "./RemoveAttachmentCommand.js";
import { MemoryNotFoundException } from "../../domain/exceptions/MemoryNotFoundException.js";

@injectable()
export class RemoveAttachmentCommandHandler {
  constructor(
    @inject(DITOKEN_IMEMORY_REPOSITORY) private readonly memoryRepository: IMemoryRepository,
    @inject(DITOKEN_IEVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  async execute(command: RemoveAttachmentCommand): Promise<Memory> {
    const memory = await this.memoryRepository.findById(new MemoryId(command.memoryId));
    if (!memory) {
      throw new MemoryNotFoundException(command.memoryId);
    }

    memory.removeAttachment(new AttachmentId(command.attachmentId), command.requestingUserId);

    await this.memoryRepository.save(memory);

    for (const event of memory.pullEvents()) {
      await this.eventBus.publish(event);
    }

    return memory;
  }
}
