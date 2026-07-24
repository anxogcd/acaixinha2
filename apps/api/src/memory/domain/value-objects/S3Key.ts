import { StringVO } from "@acaixinha/shared";

const S3_KEY_PATTERN = /^[a-zA-Z0-9\-_/.]+$/;

export class S3Key extends StringVO<"S3Key"> {
  static readonly _config = { pattern: S3_KEY_PATTERN };
  declare readonly value: string;

  constructor(value: string) {
    super(value);
  }
}
