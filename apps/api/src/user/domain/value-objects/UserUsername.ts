import { StringVO } from "@acaixinha/shared";

const USERNAME_PATTERN = /^@?[a-z0-9_]{3,30}$/;

export class UserUsername extends StringVO<"UserUsername"> {
  static readonly config = { ...StringVO._config, pattern: USERNAME_PATTERN };
  declare readonly value: string;

  constructor(value: string) {
    super(value);
  }
}
