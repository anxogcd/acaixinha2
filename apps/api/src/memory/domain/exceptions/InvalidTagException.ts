import { MemoryDomainErrors } from "../constants/index.js";

export class InvalidTagException extends Error {
  readonly code = MemoryDomainErrors.INVALID_TAG;

  constructor(tag: string) {
    super(`Invalid tag format: ${tag}`);
    this.name = "InvalidTagException";
  }
}
