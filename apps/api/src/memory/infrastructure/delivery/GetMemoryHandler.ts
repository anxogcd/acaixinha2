import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetMemoryUseCase } from "../../../memory/application/use-cases/GetMemoryUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class GetMemoryHandler {
  constructor(@inject(GetMemoryUseCase) private readonly useCase: GetMemoryUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    const memoryId = event.pathParameters?.memoryId;
    if (!memoryId) {
      return Promise.resolve({
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          code: "VALIDATION_ERROR",
          message: "Missing path parameter: memoryId",
        }),
      });
    }
    return new LambdaHandlerBuilder().handle(async () => {
      const result = await this.useCase.execute(memoryId, ctx.userId);
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(result) };
    })(event);
  }
}
