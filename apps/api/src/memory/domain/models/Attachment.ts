import { AttachmentId } from "../value-objects/AttachmentId.js";
import { S3Key } from "../value-objects/S3Key.js";
import { MimeType } from "../value-objects/MimeType.js";
import { AttachmentDescription } from "../value-objects/AttachmentDescription.js";

interface AttachmentProps {
  id: AttachmentId;
  s3Key: S3Key;
  mimeType: MimeType;
  description: AttachmentDescription | null;
  uploadedByUserId: string;
}

export class Attachment {
  readonly id: AttachmentId;
  readonly s3Key: S3Key;
  readonly mimeType: MimeType;
  description: AttachmentDescription | null;
  readonly uploadedByUserId: string;
  readonly uploadedAt: Date;

  private constructor(props: AttachmentProps) {
    this.id = props.id;
    this.s3Key = props.s3Key;
    this.mimeType = props.mimeType;
    this.description = props.description;
    this.uploadedByUserId = props.uploadedByUserId;
    this.uploadedAt = new Date();
  }

  static create(props: AttachmentProps): Attachment {
    return new Attachment(props);
  }
}
