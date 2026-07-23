import { injectable, inject } from "tsyringe";
import { SearchMemoriesQuery } from "../queries/SearchMemoriesQuery.js";
import { SearchMemoriesQueryHandler } from "../queries/SearchMemoriesQueryHandler.js";
import { MemoryResponseDTO } from "../dto/MemoryResponseDTO.js";
import type { SearchMemoriesDTO } from "../dto/SearchMemoriesDTO.js";

@injectable()
export class SearchMemoriesUseCase {
  constructor(
    @inject(SearchMemoriesQueryHandler) private readonly handler: SearchMemoriesQueryHandler,
  ) {}

  async execute(userId: string, filters: SearchMemoriesDTO): Promise<MemoryResponseDTO[]> {
    const query = new SearchMemoriesQuery(userId, filters);
    return this.handler.execute(query);
  }
}
