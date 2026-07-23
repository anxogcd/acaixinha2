import { UserDomainErrors } from "../constants/index.js";

export class InvalidUsernameException extends Error {
  readonly code = UserDomainErrors.INVALID_USERNAME;

  constructor(username: string) {
    super(`Invalid username format: ${username}`);
    this.name = "InvalidUsernameException";
  }
}
