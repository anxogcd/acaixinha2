import { StringVO } from "@acaixinha/shared";

export class AttachmentDescription extends StringVO<"AttachmentDescription"> {
  static readonly _config = { maxLength: 500, nullable: true };

  constructor(value: string | null) {
    super(value);
  }
}
