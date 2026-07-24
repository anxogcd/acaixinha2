import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { RemoveAttachmentUseCase } from "../../../memory/application/use-cases/RemoveAttachmentUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class RemoveAttachmentHandler {
  constructor(@inject(RemoveAttachmentUseCase) private readonly useCase: RemoveAttachmentUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    const memoryId = event.pathParameters?.memoryId ?? "";
    const attachmentId = event.pathParameters?.attachmentId ?? "";
    return new LambdaHandlerBuilder()
      .handle(async () => {
        const result = await this.useCase.execute(memoryId, attachmentId, ctx.userId);
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(result) };
      })(event);
  }
}