import { injectable, inject } from "tsyringe";
import { ShareMemoryCommand } from "../commands/ShareMemoryCommand.js";
import { ShareMemoryCommandHandler } from "../commands/ShareMemoryCommandHandler.js";
import { MemoryResponseDTO } from "../dto/MemoryResponseDTO.js";
import { MemoryMapper } from "../mappers/MemoryMapper.js";

@injectable()
export class ShareMemoryUseCase {
  constructor(
    @inject(ShareMemoryCommandHandler) private readonly handler: ShareMemoryCommandHandler,
  ) {}

  async execute(
    memoryId: string,
    requestingUserId: string,
    targetUserId: string,
  ): Promise<MemoryResponseDTO> {
    const command = new ShareMemoryCommand(memoryId, requestingUserId, targetUserId);
    const memory = await this.handler.execute(command);
    return MemoryMapper.toResponse(memory);
  }
}
