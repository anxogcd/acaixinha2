import { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { injectable } from "tsyringe";

const DEFAULT_UPLOAD_EXPIRES = 900; // 15 minutes
const DEFAULT_DOWNLOAD_EXPIRES = 3600; // 1 hour

@injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET_NAME ?? "acaixinha-storage-dev";
    this.client = new S3Client({
      region: process.env.S3_REGION ?? "eu-west-1",
    });
  }

  async generateUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = DEFAULT_UPLOAD_EXPIRES,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async generateDownloadUrl(
    key: string,
    expiresIn: number = DEFAULT_DOWNLOAD_EXPIRES,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.client.send(command);
  }
}
