import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { AddAttachmentUseCase } from "../../../memory/application/use-cases/AddAttachmentUseCase.js";
import { GetMemoryUseCase } from "../../../memory/application/use-cases/GetMemoryUseCase.js";
import { S3KeyGenerator } from "../../../shared/infrastructure/storage/S3KeyGenerator.js";
import { FileValidator } from "../../../shared/infrastructure/storage/FileValidator.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { confirmAttachmentSchema } from "../../../shared/infrastructure/validation/schemas/memory.schemas.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class ConfirmAttachmentHandler {
  constructor(
    @inject(AddAttachmentUseCase) private readonly addAttachmentUseCase: AddAttachmentUseCase,
    @inject(GetMemoryUseCase) private readonly getMemoryUseCase: GetMemoryUseCase,
    @inject(S3KeyGenerator) private readonly keyGenerator: S3KeyGenerator,
    @inject(FileValidator) private readonly fileValidator: FileValidator,
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
    return new LambdaHandlerBuilder()
      .validate(confirmAttachmentSchema)
      .handle(async (_event, parsed) => {
        const data = parsed as z.infer<typeof confirmAttachmentSchema>;

        if (!this.fileValidator.isMimeTypeAllowed(data.mimeType)) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              code: "INVALID_MIME_TYPE",
              message: `MIME type ${data.mimeType} is not allowed`,
            }),
          };
        }

        await this.getMemoryUseCase.execute(memoryId, ctx.userId);

        const s3Key = this.keyGenerator.generateMemoryAttachmentKey(
          memoryId,
          attachmentId,
          data.mimeType,
        );

        const result = await this.addAttachmentUseCase.execute(
          memoryId,
          ctx.userId,
          s3Key,
          data.mimeType,
          data.description,
        );

        return { statusCode: 201, headers: corsHeaders, body: JSON.stringify(result) };
      })(event);
  }
}
