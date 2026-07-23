import { injectable, inject } from "tsyringe";
import { MemoryId } from "../../domain/value-objects/MemoryId.js";
import { DITOKEN_IMEMORY_REPOSITORY } from "../../domain/repositories/IMemoryRepository.js";
import type { IMemoryRepository } from "../../domain/repositories/IMemoryRepository.js";
import { GetMemoryByIdQuery } from "./GetMemoryByIdQuery.js";
import { MemoryResponseDTO } from "../dto/MemoryResponseDTO.js";
import { MemoryMapper } from "../mappers/MemoryMapper.js";
import { MemoryNotFoundException } from "../../domain/exceptions/MemoryNotFoundException.js";
import { UnauthorizedMemoryAccessException } from "../../domain/exceptions/UnauthorizedMemoryAccessException.js";

@injectable()
export class GetMemoryByIdQueryHandler {
  constructor(
    @inject(DITOKEN_IMEMORY_REPOSITORY) private readonly memoryRepository: IMemoryRepository,
  ) {}

  async execute(query: GetMemoryByIdQuery): Promise<MemoryResponseDTO> {
    const memory = await this.memoryRepository.findById(new MemoryId(query.memoryId));
    if (!memory) {
      throw new MemoryNotFoundException(query.memoryId);
    }

    if (!memory.isOwner(query.requestingUserId) && !memory.isSharedWith(query.requestingUserId)) {
      throw new UnauthorizedMemoryAccessException(query.memoryId, query.requestingUserId);
    }

    return MemoryMapper.toResponse(memory);
  }
}
