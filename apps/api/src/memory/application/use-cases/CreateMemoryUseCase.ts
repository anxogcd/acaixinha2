import { injectable, inject } from "tsyringe";
import { CreateMemoryCommand } from "../commands/CreateMemoryCommand.js";
import { CreateMemoryCommandHandler } from "../commands/CreateMemoryCommandHandler.js";
import { MemoryResponseDTO } from "../dto/MemoryResponseDTO.js";
import { MemoryMapper } from "../mappers/MemoryMapper.js";

@injectable()
export class CreateMemoryUseCase {
  constructor(
    @inject(CreateMemoryCommandHandler) private readonly handler: CreateMemoryCommandHandler,
  ) {}

  async execute(
    ownerId: string,
    title: string,
    description: string,
    memoryDate: string,
    locationName?: string,
    coordinates?: { latitude: number; longitude: number },
    tags?: string[],
  ): Promise<MemoryResponseDTO> {
    const command = new CreateMemoryCommand(
      ownerId,
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
