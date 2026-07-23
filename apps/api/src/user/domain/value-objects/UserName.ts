import { StringVO } from "@acaixinha/shared";

export class UserName extends StringVO<"UserName"> {
  static readonly config = { minLength: 1, maxLength: 100 };
  declare readonly value: string;

  constructor(value: string) {
    super(value);
  }
}
