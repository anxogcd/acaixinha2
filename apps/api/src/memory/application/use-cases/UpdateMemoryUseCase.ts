import { injectable, inject } from "tsyringe";
import { UpdateMemoryCommand } from "../commands/UpdateMemoryCommand.js";
import { UpdateMemoryCommandHandler } from "../commands/UpdateMemoryCommandHandler.js";
import { MemoryResponseDTO } from "../dto/MemoryResponseDTO.js";
import { MemoryMapper } from "../mappers/MemoryMapper.js";

@injectable()
export class UpdateMemoryUseCase {
  constructor(
    @inject(UpdateMemoryCommandHandler) private readonly handler: UpdateMemoryCommandHandler,
  ) {}

  async execute(
    memoryId: string,
    requestingUserId: string,
    title?: string,
    description?: string,
    memoryDate?: string,
    locationName?: string,
    coordinates?: { latitude: number; longitude: number },
    tags?: string[],
  ): Promise<MemoryResponseDTO> {
    const command = new UpdateMemoryCommand(
      memoryId,
      requestingUserId,
      title,
      description,
      memoryDate,
      locationName,
      coordinates,
      tags,
    );
    const memory = await this.handler.execute(command);
    return MemoryMapper.toResponse(memory);
  }
}
