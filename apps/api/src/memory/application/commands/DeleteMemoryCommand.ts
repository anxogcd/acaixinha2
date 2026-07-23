export class DeleteMemoryCommand {
  constructor(
    public readonly memoryId: string,
    public readonly requestingUserId: string,
  ) {}
}
