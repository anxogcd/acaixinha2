import { injectable, inject } from "tsyringe";
import { RemoveAttachmentCommand } from "../commands/RemoveAttachmentCommand.js";
import { RemoveAttachmentCommandHandler } from "../commands/RemoveAttachmentCommandHandler.js";
import { MemoryResponseDTO } from "../dto/MemoryResponseDTO.js";
import { MemoryMapper } from "../mappers/MemoryMapper.js";

@injectable()
export class RemoveAttachmentUseCase {
  constructor(
    @inject(RemoveAttachmentCommandHandler)
    private readonly handler: RemoveAttachmentCommandHandler,
  ) {}

  async execute(
    memoryId: string,
    attachmentId: string,
    requestingUserId: string,
  ): Promise<MemoryResponseDTO> {
    const command = new RemoveAttachmentCommand(memoryId, attachmentId, requestingUserId);
    const memory = await this.handler.execute(command);
    return MemoryMapper.toResponse(memory);
  }
}
