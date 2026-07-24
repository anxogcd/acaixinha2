import { injectable, inject } from "tsyringe";
import { GetMemoryByIdQuery } from "../queries/GetMemoryByIdQuery.js";
import { GetMemoryByIdQueryHandler } from "../queries/GetMemoryByIdQueryHandler.js";
import type { MemoryResponseDTO } from "../dto/MemoryResponseDTO.js";

@injectable()
export class GetMemoryUseCase {
  constructor(
    @inject(GetMemoryByIdQueryHandler) private readonly handler: GetMemoryByIdQueryHandler,
  ) {}

  async execute(memoryId: string, requestingUserId: string): Promise<MemoryResponseDTO> {
    const query = new GetMemoryByIdQuery(memoryId, requestingUserId);
    return this.handler.execute(query);
  }
}
