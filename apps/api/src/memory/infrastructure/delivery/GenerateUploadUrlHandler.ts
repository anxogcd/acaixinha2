import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { GetMemoryUseCase } from "../../../memory/application/use-cases/GetMemoryUseCase.js";
import { S3Service } from "../../../shared/infrastructure/storage/S3Service.js";
import { S3KeyGenerator } from "../../../shared/infrastructure/storage/S3KeyGenerator.js";
import { FileValidator } from "../../../shared/infrastructure/storage/FileValidator.js";
import { DITOKEN_ID_GENERATOR } from "@acaixinha/shared";
import type { IIdGenerator } from "@acaixinha/shared";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { generateUploadUrlSchema } from "../../../shared/infrastructure/validation/schemas/memory.schemas.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class GenerateUploadUrlHandler {
  constructor(
    @inject(GetMemoryUseCase) private readonly getMemoryUseCase: GetMemoryUseCase,
    @inject(S3Service) private readonly s3Service: S3Service,
    @inject(S3KeyGenerator) private readonly keyGenerator: S3KeyGenerator,
    @inject(FileValidator) private readonly fileValidator: FileValidator,
    @inject(DITOKEN_ID_GENERATOR) private readonly idGenerator: IIdGenerator,
  ) {}

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
    return new LambdaHandlerBuilder()
      .validate(generateUploadUrlSchema)
      .handle(async (_event, parsed) => {
        const data = parsed as z.infer<typeof generateUploadUrlSchema>;

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

        const attachmentId = this.idGenerator.generate();
        const s3Key = this.keyGenerator.generateMemoryAttachmentKey(
          memoryId,
          attachmentId,
          data.mimeType,
        );
        const uploadUrl = await this.s3Service.generateUploadUrl(s3Key, data.mimeType);

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ uploadUrl, attachmentId, s3Key }),
        };
      })(event);
  }
}
