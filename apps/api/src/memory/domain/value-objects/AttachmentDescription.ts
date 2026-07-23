import { StringVO } from "@acaixinha/shared";

export class AttachmentDescription extends StringVO<"AttachmentDescription"> {
  static readonly config = { maxLength: 500, nullable: true };

  constructor(value: string | null) {
    super(value);
  }
}
