import { MemoryDomainErrors } from "../constants/index.js";

export class UnauthorizedMemoryAccessException extends Error {
  readonly code = MemoryDomainErrors.UNAUTHORIZED_MEMORY_ACCESS;

  constructor(memoryId: string, userId: string) {
    super(`User ${userId} is not authorized to access memory ${memoryId}`);
    this.name = "UnauthorizedMemoryAccessException";
  }
}
