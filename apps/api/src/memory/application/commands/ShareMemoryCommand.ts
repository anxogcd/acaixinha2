export class ShareMemoryCommand {
  constructor(
    public readonly memoryId: string,
    public readonly requestingUserId: string,
    public readonly targetUserId: string,
  ) {}
}
