export class UpdateMemoryCommand {
  constructor(
    public readonly memoryId: string,
    public readonly requestingUserId: string,
    public readonly title?: string,
    public readonly description?: string,
    public readonly memoryDate?: string,
    public readonly locationName?: string,
    public readonly coordinates?: { latitude: number; longitude: number },
    public readonly tags?: string[],
  ) {}
}
