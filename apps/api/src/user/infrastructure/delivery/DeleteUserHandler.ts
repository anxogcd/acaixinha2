import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DeleteUserUseCase } from "../../../user/application/use-cases/DeleteUserUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class DeleteUserHandler {
  constructor(@inject(DeleteUserUseCase) private readonly useCase: DeleteUserUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    return new LambdaHandlerBuilder()
      .handle(async () => {
        await this.useCase.execute(ctx.userId);
        return {
          statusCode: 204,
          headers: corsHeaders,
          body: "",
        };
      })(event);
  }
}