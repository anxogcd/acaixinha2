import { StringVO } from "@acaixinha/shared";

const TAG_PATTERN = /^[a-z0-9_-]+$/;

export class Tag extends StringVO<"Tag"> {
  static readonly config = { minLength: 1, maxLength: 50, pattern: TAG_PATTERN };
  declare readonly value: string;

  constructor(value: string) {
    super(value);
  }
}
