export const UserDomainEvents = {
  USER_CREATED: "user.created",
  USER_PROFILE_UPDATED: "user.profile.updated",
  USER_MEMORY_SHARED: "user.memory.shared",
} as const;

export type UserDomainEventType = (typeof UserDomainEvents)[keyof typeof UserDomainEvents];

export const UserDomainErrors = {
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",
  INVALID_USERNAME: "INVALID_USERNAME",
} as const;

export type UserDomainErrorCode = (typeof UserDomainErrors)[keyof typeof UserDomainErrors];
