import { injectable, inject } from "tsyringe";
import { DeleteMemoryCommand } from "../commands/DeleteMemoryCommand.js";
import { DeleteMemoryCommandHandler } from "../commands/DeleteMemoryCommandHandler.js";

@injectable()
export class DeleteMemoryUseCase {
  constructor(
    @inject(DeleteMemoryCommandHandler) private readonly handler: DeleteMemoryCommandHandler,
  ) {}

  async execute(memoryId: string, requestingUserId: string): Promise<void> {
    const command = new DeleteMemoryCommand(memoryId, requestingUserId);
    await this.handler.execute(command);
  }
}
