export class GetMemoryByIdQuery {
  constructor(
    public readonly memoryId: string,
    public readonly requestingUserId: string,
  ) {}
}
