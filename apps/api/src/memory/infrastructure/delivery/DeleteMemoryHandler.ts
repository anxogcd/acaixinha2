import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DeleteMemoryUseCase } from "../../../memory/application/use-cases/DeleteMemoryUseCase.js";
import { S3Service } from "../../../shared/infrastructure/storage/S3Service.js";
import { DITOKEN_IMEMORY_REPOSITORY } from "../../domain/repositories/IMemoryRepository.js";
import type { IMemoryRepository } from "../../domain/repositories/IMemoryRepository.js";
import { MemoryId } from "../../domain/value-objects/MemoryId.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import { mapErrorToHttpResponse } from "../../../shared/infrastructure/delivery/HttpErrorMapper.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class DeleteMemoryHandler {
  constructor(
    @inject(DeleteMemoryUseCase) private readonly useCase: DeleteMemoryUseCase,
    @inject(S3Service) private readonly s3Service: S3Service,
    @inject(DITOKEN_IMEMORY_REPOSITORY) private readonly memoryRepository: IMemoryRepository,
  ) {}

  async handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    const memoryId = event.pathParameters?.memoryId;
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

    try {
      const memory = await this.memoryRepository.findById(new MemoryId(memoryId));
      const s3Keys = memory?.attachments.map((a) => a.s3Key.value) ?? [];

      await this.useCase.execute(memoryId, ctx.userId);

      for (const s3Key of s3Keys) {
        await this.s3Service.deleteObject(s3Key).catch((err) => {
          console.error("Failed to delete S3 object:", s3Key, err);
        });
      }

      return { statusCode: 204, headers: corsHeaders, body: "" };
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
