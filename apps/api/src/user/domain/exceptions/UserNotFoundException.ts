import { UserDomainErrors } from "../constants/index.js";

export class UserNotFoundException extends Error {
  readonly code = UserDomainErrors.USER_NOT_FOUND;

  constructor(identifier: string) {
    super(`User not found: ${identifier}`);
    this.name = "UserNotFoundException";
  }
}
