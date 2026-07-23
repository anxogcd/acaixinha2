import { injectable, inject } from "tsyringe";
import { DeleteUserCommand } from "../commands/DeleteUserCommand.js";
import { DeleteUserCommandHandler } from "../commands/DeleteUserCommandHandler.js";

@injectable()
export class DeleteUserUseCase {
  constructor(
    @inject(DeleteUserCommandHandler) private readonly handler: DeleteUserCommandHandler,
  ) {}

  async execute(userId: string): Promise<void> {
    const command = new DeleteUserCommand(userId);
    await this.handler.execute(command);
  }
}
