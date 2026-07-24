import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DeleteMemoryUseCase } from "../../../memory/application/use-cases/DeleteMemoryUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class DeleteMemoryHandler {
  constructor(@inject(DeleteMemoryUseCase) private readonly useCase: DeleteMemoryUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    const memoryId = event.pathParameters?.memoryId;
    if (!memoryId) {
      return Promise.resolve({
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ code: "VALIDATION_ERROR", message: "Missing path parameter: memoryId" }),
      });
    }
    return new LambdaHandlerBuilder()
      .handle(async () => {
        await this.useCase.execute(memoryId, ctx.userId);
        return { statusCode: 204, headers: corsHeaders, body: "" };
      })(event);
  }
}