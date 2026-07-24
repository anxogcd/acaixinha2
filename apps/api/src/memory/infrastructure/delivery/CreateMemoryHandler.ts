import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { CreateMemoryUseCase } from "../../../memory/application/use-cases/CreateMemoryUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { createMemorySchema } from "../../../shared/infrastructure/validation/schemas/memory.schemas.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class CreateMemoryHandler {
  constructor(@inject(CreateMemoryUseCase) private readonly useCase: CreateMemoryUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    return new LambdaHandlerBuilder()
      .validate(createMemorySchema)
      .handle(async (_event, parsed) => {
        const data = parsed as z.infer<typeof createMemorySchema>;
        const result = await this.useCase.execute(
          ctx.userId,
          data.title,
          data.description,
          data.memoryDate,
          data.locationName,
          data.coordinates
            ? { latitude: data.coordinates.lat, longitude: data.coordinates.lng }
            : undefined,
          data.tags,
        );
        return { statusCode: 201, headers: corsHeaders, body: JSON.stringify(result) };
      })(event);
  }
}
