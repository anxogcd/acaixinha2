import { StringVO } from "@acaixinha/shared";

const S3_KEY_PATTERN = /^[a-zA-Z0-9\-_/.]+$/;

export class UserAvatarUrl extends StringVO<"UserAvatarUrl"> {
  static readonly _config = { pattern: S3_KEY_PATTERN, nullable: true };

  constructor(value: string | null) {
    super(value);
  }
}
