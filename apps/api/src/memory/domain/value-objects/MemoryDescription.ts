import { StringVO } from "@acaixinha/shared";

export class MemoryDescription extends StringVO<"MemoryDescription"> {
  static readonly _config = { maxLength: 10000 };
  declare readonly value: string;

  constructor(value: string) {
    super(value);
  }
}
