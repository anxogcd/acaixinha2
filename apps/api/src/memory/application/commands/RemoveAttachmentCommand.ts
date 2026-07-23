export class RemoveAttachmentCommand {
  constructor(
    public readonly memoryId: string,
    public readonly attachmentId: string,
    public readonly requestingUserId: string,
  ) {}
}
