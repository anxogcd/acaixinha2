export class UpdateUserProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly name?: string,
    public readonly avatarUrl?: string,
    public readonly description?: string,
  ) {}
}
