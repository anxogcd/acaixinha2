import { StringVO } from "@acaixinha/shared";

const ALLOWED_MIME_TYPES = [/^image\//, /^video\//, /^audio\//, /^application\/pdf$/];

export class MimeType extends StringVO<"MimeType"> {
  static readonly _config = { pattern: /.*/ };
  declare readonly value: string;

  constructor(value: string) {
    super(value);

    if (!ALLOWED_MIME_TYPES.some((p) => p.test(value))) {
      throw new Error(
        `MimeType ${value} is not allowed. Allowed types: image/*, video/*, audio/*, application/pdf`,
      );
    }
  }
}
