import type { Memory } from "../models/Memory.js";
import type { MemoryId } from "../value-objects/MemoryId.js";

export const DITOKEN_IMEMORY_REPOSITORY = Symbol("IMemoryRepository");

export interface MemorySearchFilters {
  text?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  ownerId?: string;
}

export interface IMemoryRepository {
  findById(id: MemoryId): Promise<Memory | null>;
  findByOwner(ownerId: string): Promise<Memory[]>;
  findBySharedWith(userId: string): Promise<Memory[]>;
  search(filters: MemorySearchFilters): Promise<Memory[]>;
  save(memory: Memory): Promise<void>;
  delete(id: MemoryId): Promise<void>;
}
