import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetMemoryUseCase } from "../../../memory/application/use-cases/GetMemoryUseCase.js";
import { S3Service } from "../../../shared/infrastructure/storage/S3Service.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class GenerateDownloadUrlHandler {
  constructor(
    @inject(GetMemoryUseCase) private readonly getMemoryUseCase: GetMemoryUseCase,
    @inject(S3Service) private readonly s3Service: S3Service,
  ) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    const memoryId = event.pathParameters?.memoryId;
    const attachmentId = event.pathParameters?.attachmentId;
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
    if (!attachmentId) {
      return Promise.resolve({
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          code: "VALIDATION_ERROR",
          message: "Missing path parameter: attachmentId",
        }),
      });
    }
    return new LambdaHandlerBuilder().handle(async () => {
      const memory = await this.getMemoryUseCase.execute(memoryId, ctx.userId);

      const attachment = memory.attachments.find((a) => a.id === attachmentId);
      if (!attachment) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({
            code: "NOT_FOUND",
            message: `Attachment ${attachmentId} not found in memory ${memoryId}`,
          }),
        };
      }

      const downloadUrl = await this.s3Service.generateDownloadUrl(attachment.s3Key);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ downloadUrl }),
      };
    })(event);
  }
}
