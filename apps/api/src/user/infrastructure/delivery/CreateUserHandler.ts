import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { CreateUserUseCase } from "../../../user/application/use-cases/CreateUserUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { createUserSchema } from "../../../shared/infrastructure/validation/schemas/user.schemas.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";

@injectable()
export class CreateUserHandler {
  constructor(@inject(CreateUserUseCase) private readonly useCase: CreateUserUseCase) {}

  handle(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return new LambdaHandlerBuilder()
      .validate(createUserSchema)
      .handle(async (_event, parsed) => {
        const { id, name, username } = parsed as z.infer<typeof createUserSchema>;
        const result = await this.useCase.execute(id, name, username);
        return {
          statusCode: 201,
          headers: corsHeaders,
          body: JSON.stringify(result),
        };
      })(event);
  }
}