import { injectable, inject } from "tsyringe";
import { AddAttachmentCommand } from "../commands/AddAttachmentCommand.js";
import { AddAttachmentCommandHandler } from "../commands/AddAttachmentCommandHandler.js";
import { MemoryResponseDTO } from "../dto/MemoryResponseDTO.js";
import { MemoryMapper } from "../mappers/MemoryMapper.js";

@injectable()
export class AddAttachmentUseCase {
  constructor(
    @inject(AddAttachmentCommandHandler) private readonly handler: AddAttachmentCommandHandler,
  ) {}

  async execute(
    memoryId: string,
    requestingUserId: string,
    s3Key: string,
    mimeType: string,
    description?: string,
  ): Promise<MemoryResponseDTO> {
    const command = new AddAttachmentCommand(
      memoryId,
      requestingUserId,
      s3Key,
      mimeType,
      description,
    );
    const memory = await this.handler.execute(command);
    return MemoryMapper.toResponse(memory);
  }
}
