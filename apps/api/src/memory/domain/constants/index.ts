export const MemoryDomainEvents = {
  MEMORY_CREATED: "memory.created",
  MEMORY_UPDATED: "memory.updated",
  MEMORY_DELETED: "memory.deleted",
  MEMORY_SHARED: "memory.shared",
  ATTACHMENT_ADDED: "attachment.added",
} as const;

export type MemoryDomainEventType = (typeof MemoryDomainEvents)[keyof typeof MemoryDomainEvents];

export const MemoryDomainErrors = {
  MEMORY_NOT_FOUND: "MEMORY_NOT_FOUND",
  UNAUTHORIZED_MEMORY_ACCESS: "UNAUTHORIZED_MEMORY_ACCESS",
  ATTACHMENT_LIMIT_EXCEEDED: "ATTACHMENT_LIMIT_EXCEEDED",
  INVALID_COORDINATES: "INVALID_COORDINATES",
  INVALID_TAG: "INVALID_TAG",
} as const;

export type MemoryDomainErrorCode = (typeof MemoryDomainErrors)[keyof typeof MemoryDomainErrors];

export const MAX_ATTACHMENTS_PER_MEMORY = 20;
