import type { SearchMemoriesDTO } from "../dto/SearchMemoriesDTO.js";

export class SearchMemoriesQuery {
  constructor(
    public readonly userId: string,
    public readonly filters: SearchMemoriesDTO,
  ) {}
}
