import { injectable, inject } from "tsyringe";
import { DITOKEN_IMEMORY_REPOSITORY } from "../../domain/repositories/IMemoryRepository.js";
import type {
  IMemoryRepository,
  MemorySearchFilters,
} from "../../domain/repositories/IMemoryRepository.js";
import { SearchMemoriesQuery } from "./SearchMemoriesQuery.js";
import { MemoryResponseDTO } from "../dto/MemoryResponseDTO.js";
import { MemoryMapper } from "../mappers/MemoryMapper.js";

@injectable()
export class SearchMemoriesQueryHandler {
  constructor(
    @inject(DITOKEN_IMEMORY_REPOSITORY) private readonly memoryRepository: IMemoryRepository,
  ) {}

  async execute(query: SearchMemoriesQuery): Promise<MemoryResponseDTO[]> {
    const filters: MemorySearchFilters = {
      text: query.filters.text,
      tags: query.filters.tags,
      dateFrom: query.filters.dateFrom ? new Date(query.filters.dateFrom) : undefined,
      dateTo: query.filters.dateTo ? new Date(query.filters.dateTo) : undefined,
      ownerId: undefined,
    };

    // Search by ownerId = requesting user (own memories)
    const ownFilters: MemorySearchFilters = { ...filters, ownerId: query.userId };
    const ownMemories = await this.memoryRepository.search(ownFilters);

    // Also get shared memories and filter in-app
    const sharedMemories = await this.memoryRepository.findBySharedWith(query.userId);

    const filteredShared = sharedMemories.filter((memory) => {
      if (filters.tags && filters.tags.length > 0) {
        const memoryTags = memory.tags.map((t) => t.value);
        if (!filters.tags.some((tag) => memoryTags.includes(tag))) return false;
      }
      if (filters.dateFrom && memory.memoryDate < filters.dateFrom) return false;
      if (filters.dateTo && memory.memoryDate > filters.dateTo) return false;
      if (filters.text) {
        const searchText = filters.text.toLowerCase();
        const titleMatch = memory.title.value.toLowerCase().includes(searchText);
        const descMatch = memory.description.value.toLowerCase().includes(searchText);
        if (!titleMatch && !descMatch) return false;
      }
      return true;
    });

    const allMemories = [...ownMemories, ...filteredShared];
    return allMemories.map((memory) => MemoryMapper.toResponse(memory));
  }
}
