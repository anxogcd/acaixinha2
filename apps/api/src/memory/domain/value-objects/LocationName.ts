import { StringVO } from "@acaixinha/shared";

export class LocationName extends StringVO<"LocationName"> {
  static readonly _config = { maxLength: 200, nullable: true };

  constructor(value: string | null) {
    super(value);
  }
}
