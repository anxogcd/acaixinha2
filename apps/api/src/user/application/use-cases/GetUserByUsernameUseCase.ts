import { injectable, inject } from "tsyringe";
import { GetUserByUsernameQuery } from "../queries/GetUserByUsernameQuery.js";
import { GetUserByUsernameQueryHandler } from "../queries/GetUserByUsernameQueryHandler.js";
import { UserResponseDTO } from "../dto/UserResponseDTO.js";

@injectable()
export class GetUserByUsernameUseCase {
  constructor(
    @inject(GetUserByUsernameQueryHandler) private readonly handler: GetUserByUsernameQueryHandler,
  ) {}

  async execute(username: string): Promise<UserResponseDTO> {
    const query = new GetUserByUsernameQuery(username);
    return this.handler.execute(query);
  }
}
