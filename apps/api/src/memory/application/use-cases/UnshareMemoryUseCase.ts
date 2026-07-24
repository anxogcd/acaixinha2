import { injectable, inject } from "tsyringe";
import { UnshareMemoryCommand } from "../commands/UnshareMemoryCommand.js";
import { UnshareMemoryCommandHandler } from "../commands/UnshareMemoryCommandHandler.js";
import { MemoryResponseDTO } from "../dto/MemoryResponseDTO.js";
import { MemoryMapper } from "../mappers/MemoryMapper.js";

@injectable()
export class UnshareMemoryUseCase {
  constructor(
    @inject(UnshareMemoryCommandHandler) private readonly handler: UnshareMemoryCommandHandler,
  ) {}

  async execute(
    memoryId: string,
    requestingUserId: string,
    targetUserId: string,
  ): Promise<MemoryResponseDTO> {
    const command = new UnshareMemoryCommand(memoryId, requestingUserId, targetUserId);
    const memory = await this.handler.execute(command);
    return MemoryMapper.toResponse(memory);
  }
}
