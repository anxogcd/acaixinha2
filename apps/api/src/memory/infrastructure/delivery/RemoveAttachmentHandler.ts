import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { RemoveAttachmentUseCase } from "../../../memory/application/use-cases/RemoveAttachmentUseCase.js";
import { S3Service } from "../../../shared/infrastructure/storage/S3Service.js";
import { DITOKEN_IMEMORY_REPOSITORY } from "../../domain/repositories/IMemoryRepository.js";
import type { IMemoryRepository } from "../../domain/repositories/IMemoryRepository.js";
import { MemoryId } from "../../domain/value-objects/MemoryId.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import { mapErrorToHttpResponse } from "../../../shared/infrastructure/delivery/HttpErrorMapper.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class RemoveAttachmentHandler {
  constructor(
    @inject(RemoveAttachmentUseCase) private readonly useCase: RemoveAttachmentUseCase,
    @inject(S3Service) private readonly s3Service: S3Service,
    @inject(DITOKEN_IMEMORY_REPOSITORY) private readonly memoryRepository: IMemoryRepository,
  ) {}

  async handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    const memoryId = event.pathParameters?.memoryId;
    const attachmentId = event.pathParameters?.attachmentId;
    if (!memoryId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          code: "VALIDATION_ERROR",
          message: "Missing path parameter: memoryId",
        }),
      };
    }
    if (!attachmentId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          code: "VALIDATION_ERROR",
          message: "Missing path parameter: attachmentId",
        }),
      };
    }

    try {
      const memory = await this.memoryRepository.findById(new MemoryId(memoryId));
      const s3Key = memory?.attachments.find((a) => a.id.value === attachmentId)?.s3Key.value;

      const result = await this.useCase.execute(memoryId, attachmentId, ctx.userId);

      if (s3Key) {
        await this.s3Service.deleteObject(s3Key).catch((err) => {
          console.error("Failed to delete S3 object:", s3Key, err);
        });
      }

      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(result) };
    } catch (err) {
      if (err instanceof Error) {
        return mapErrorToHttpResponse(err);
      }
      console.error("Unknown error:", err);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ code: "INTERNAL_ERROR", message: "Unknown error" }),
      };
    }
  }
}
