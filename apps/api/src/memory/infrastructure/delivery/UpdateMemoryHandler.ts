import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { UpdateMemoryUseCase } from "../../../memory/application/use-cases/UpdateMemoryUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { updateMemorySchema } from "../../../shared/infrastructure/validation/schemas/memory.schemas.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class UpdateMemoryHandler {
  constructor(@inject(UpdateMemoryUseCase) private readonly useCase: UpdateMemoryUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    const memoryId = event.pathParameters?.memoryId ?? "";
    return new LambdaHandlerBuilder()
      .validate(updateMemorySchema)
      .handle(async (_event, parsed) => {
        const data = parsed as z.infer<typeof updateMemorySchema>;
        const result = await this.useCase.execute(
          memoryId,
          ctx.userId,
          data.title,
          data.description,
          data.memoryDate,
          data.locationName ?? undefined,
          data.coordinates
            ? { latitude: data.coordinates.lat, longitude: data.coordinates.lng }
            : undefined,
          data.tags,
        );
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(result) };
      })(event);
  }
}