import { injectable, inject } from "tsyringe";
import { Memory } from "../../domain/models/Memory.js";
import { Attachment } from "../../domain/models/Attachment.js";
import { MemoryId } from "../../domain/value-objects/MemoryId.js";
import { AttachmentId } from "../../domain/value-objects/AttachmentId.js";
import { S3Key } from "../../domain/value-objects/S3Key.js";
import { MimeType } from "../../domain/value-objects/MimeType.js";
import { AttachmentDescription } from "../../domain/value-objects/AttachmentDescription.js";
import { DITOKEN_IMEMORY_REPOSITORY } from "../../domain/repositories/IMemoryRepository.js";
import type { IMemoryRepository } from "../../domain/repositories/IMemoryRepository.js";
import { DITOKEN_IEVENT_BUS } from "@acaixinha/shared";
import type { IEventBus } from "@acaixinha/shared";
import { DITOKEN_ID_GENERATOR } from "@acaixinha/shared";
import type { IIdGenerator } from "@acaixinha/shared";
import { AddAttachmentCommand } from "./AddAttachmentCommand.js";
import { MemoryNotFoundException } from "../../domain/exceptions/MemoryNotFoundException.js";
import { UnauthorizedMemoryAccessException } from "../../domain/exceptions/UnauthorizedMemoryAccessException.js";

@injectable()
export class AddAttachmentCommandHandler {
  constructor(
    @inject(DITOKEN_IMEMORY_REPOSITORY) private readonly memoryRepository: IMemoryRepository,
    @inject(DITOKEN_IEVENT_BUS) private readonly eventBus: IEventBus,
    @inject(DITOKEN_ID_GENERATOR) private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(command: AddAttachmentCommand): Promise<Memory> {
    const memory = await this.memoryRepository.findById(new MemoryId(command.memoryId));
    if (!memory) {
      throw new MemoryNotFoundException(command.memoryId);
    }

    if (!memory.canUserAddAttachment(command.requestingUserId)) {
      throw new UnauthorizedMemoryAccessException(command.memoryId, command.requestingUserId);
    }

    const attachment = Attachment.create({
      id: new AttachmentId(this.idGenerator.generate()),
      s3Key: new S3Key(command.s3Key),
      mimeType: new MimeType(command.mimeType),
      description: command.description ? new AttachmentDescription(command.description) : null,
      uploadedByUserId: command.requestingUserId,
    });

    memory.addAttachment(attachment);

    await this.memoryRepository.save(memory);

    for (const event of memory.pullEvents()) {
      await this.eventBus.publish(event);
    }

    return memory;
  }
}
