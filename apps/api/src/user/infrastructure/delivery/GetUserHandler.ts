import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetUserByIdUseCase } from "../../../user/application/use-cases/GetUserByIdUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class GetUserHandler {
  constructor(@inject(GetUserByIdUseCase) private readonly useCase: GetUserByIdUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return Promise.resolve({
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ code: "VALIDATION_ERROR", message: "Missing path parameter: userId" }),
      });
    }
    return new LambdaHandlerBuilder()
      .handle(async () => {
        const result = await this.useCase.execute(userId);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(result),
        };
      })(event);
  }
}