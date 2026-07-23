export class UnshareMemoryCommand {
  constructor(
    public readonly memoryId: string,
    public readonly requestingUserId: string,
    public readonly targetUserId: string,
  ) {}
}
