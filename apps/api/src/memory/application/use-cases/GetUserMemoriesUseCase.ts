import { injectable, inject } from "tsyringe";
import { GetUserMemoriesQuery } from "../queries/GetUserMemoriesQuery.js";
import { GetUserMemoriesQueryHandler } from "../queries/GetUserMemoriesQueryHandler.js";
import type { MemoryResponseDTO } from "../dto/MemoryResponseDTO.js";

@injectable()
export class GetUserMemoriesUseCase {
  constructor(
    @inject(GetUserMemoriesQueryHandler) private readonly handler: GetUserMemoriesQueryHandler,
  ) {}

  async execute(userId: string): Promise<MemoryResponseDTO[]> {
    const query = new GetUserMemoriesQuery(userId);
    return this.handler.execute(query);
  }
}