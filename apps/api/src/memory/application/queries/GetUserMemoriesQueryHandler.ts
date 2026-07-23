import { injectable, inject } from "tsyringe";
import { DITOKEN_IMEMORY_REPOSITORY } from "../../domain/repositories/IMemoryRepository.js";
import type { IMemoryRepository } from "../../domain/repositories/IMemoryRepository.js";
import { GetUserMemoriesQuery } from "./GetUserMemoriesQuery.js";
import { MemoryResponseDTO } from "../dto/MemoryResponseDTO.js";
import { MemoryMapper } from "../mappers/MemoryMapper.js";

@injectable()
export class GetUserMemoriesQueryHandler {
  constructor(
    @inject(DITOKEN_IMEMORY_REPOSITORY) private readonly memoryRepository: IMemoryRepository,
  ) {}

  async execute(query: GetUserMemoriesQuery): Promise<MemoryResponseDTO[]> {
    const ownMemories = await this.memoryRepository.findByOwner(query.userId);
    const sharedMemories = await this.memoryRepository.findBySharedWith(query.userId);

    const allMemories = [...ownMemories, ...sharedMemories];
    return allMemories.map((memory) => MemoryMapper.toResponse(memory));
  }
}
