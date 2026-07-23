import { injectable, inject } from "tsyringe";
import { GetUserByIdQuery } from "../queries/GetUserByIdQuery.js";
import { GetUserByIdQueryHandler } from "../queries/GetUserByIdQueryHandler.js";
import { UserResponseDTO } from "../dto/UserResponseDTO.js";

@injectable()
export class GetUserByIdUseCase {
  constructor(@inject(GetUserByIdQueryHandler) private readonly handler: GetUserByIdQueryHandler) {}

  async execute(userId: string): Promise<UserResponseDTO> {
    const query = new GetUserByIdQuery(userId);
    return this.handler.execute(query);
  }
}
