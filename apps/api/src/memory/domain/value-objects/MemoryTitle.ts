import { StringVO } from "@acaixinha/shared";

export class MemoryTitle extends StringVO<"MemoryTitle"> {
  static readonly _config = { minLength: 1, maxLength: 200 };
  declare readonly value: string;

  constructor(value: string) {
    super(value);
  }
}
