import { MemoryDomainErrors, MAX_ATTACHMENTS_PER_MEMORY } from "../constants/index.js";

export class AttachmentLimitExceededException extends Error {
  readonly code = MemoryDomainErrors.ATTACHMENT_LIMIT_EXCEEDED;

  constructor(memoryId: string) {
    super(
      `Memory ${memoryId} has reached the maximum of ${MAX_ATTACHMENTS_PER_MEMORY} attachments`,
    );
    this.name = "AttachmentLimitExceededException";
  }
}
