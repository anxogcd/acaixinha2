import { MemoryDomainErrors } from "../constants/index.js";

export class MemoryNotFoundException extends Error {
  readonly code = MemoryDomainErrors.MEMORY_NOT_FOUND;

  constructor(identifier: string) {
    super(`Memory not found: ${identifier}`);
    this.name = "MemoryNotFoundException";
  }
}
