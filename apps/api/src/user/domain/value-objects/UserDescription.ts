import { StringVO } from "@acaixinha/shared";

export class UserDescription extends StringVO<"UserDescription"> {
  static readonly config = { maxLength: 500, nullable: true };

  constructor(value: string | null) {
    super(value);
  }
}
