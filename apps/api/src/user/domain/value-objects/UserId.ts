import { StringVO } from "@acaixinha/shared";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class UserId extends StringVO<"UserId"> {
  static readonly config = { pattern: UUID_REGEX };
  declare readonly value: string;

  constructor(value: string) {
    super(value);
  }
}
