import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { ShareMemoryUseCase } from "../../../memory/application/use-cases/ShareMemoryUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { shareMemorySchema } from "../../../shared/infrastructure/validation/schemas/memory.schemas.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class ShareMemoryHandler {
  constructor(@inject(ShareMemoryUseCase) private readonly useCase: ShareMemoryUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    const memoryId = event.pathParameters?.memoryId ?? "";
    return new LambdaHandlerBuilder()
      .validate(shareMemorySchema)
      .handle(async (_event, parsed) => {
        const data = parsed as z.infer<typeof shareMemorySchema>;
        const result = await this.useCase.execute(memoryId, ctx.userId, data.targetUserId);
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(result) };
      })(event);
  }
}