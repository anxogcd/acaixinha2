import { StringVO } from "@acaixinha/shared";

export class UserDescription extends StringVO<"UserDescription"> {
  static readonly _config = { maxLength: 500, nullable: true };

  constructor(value: string | null) {
    super(value);
  }
}
