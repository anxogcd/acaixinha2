import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { UnshareMemoryUseCase } from "../../../memory/application/use-cases/UnshareMemoryUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class UnshareMemoryHandler {
  constructor(@inject(UnshareMemoryUseCase) private readonly useCase: UnshareMemoryUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    const memoryId = event.pathParameters?.memoryId ?? "";
    const targetUserId = event.pathParameters?.userId ?? "";
    return new LambdaHandlerBuilder()
      .handle(async () => {
        const result = await this.useCase.execute(memoryId, ctx.userId, targetUserId);
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(result) };
      })(event);
  }
}