import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { AddAttachmentUseCase } from "../../../memory/application/use-cases/AddAttachmentUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { addAttachmentSchema } from "../../../shared/infrastructure/validation/schemas/memory.schemas.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class AddAttachmentHandler {
  constructor(@inject(AddAttachmentUseCase) private readonly useCase: AddAttachmentUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    const memoryId = event.pathParameters?.memoryId ?? "";
    return new LambdaHandlerBuilder()
      .validate(addAttachmentSchema)
      .handle(async (_event, parsed) => {
        const data = parsed as z.infer<typeof addAttachmentSchema>;
        const result = await this.useCase.execute(
          memoryId,
          ctx.userId,
          data.s3Key,
          data.mimeType,
          data.description,
        );
        return { statusCode: 201, headers: corsHeaders, body: JSON.stringify(result) };
      })(event);
  }
}