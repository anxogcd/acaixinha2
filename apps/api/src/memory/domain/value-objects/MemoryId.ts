import { StringVO } from "@acaixinha/shared";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class MemoryId extends StringVO<"MemoryId"> {
  static readonly _config = { pattern: UUID_REGEX };
  declare readonly value: string;

  constructor(value: string) {
    super(value);
  }
}
