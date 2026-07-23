export class AddAttachmentCommand {
  constructor(
    public readonly memoryId: string,
    public readonly requestingUserId: string,
    public readonly s3Key: string,
    public readonly mimeType: string,
    public readonly description?: string,
  ) {}
}
