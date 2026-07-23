import { UserDomainErrors } from "../constants/index.js";

export class UserAlreadyExistsException extends Error {
  readonly code = UserDomainErrors.USER_ALREADY_EXISTS;

  constructor(username: string) {
    super(`User already exists with username: ${username}`);
    this.name = "UserAlreadyExistsException";
  }
}
