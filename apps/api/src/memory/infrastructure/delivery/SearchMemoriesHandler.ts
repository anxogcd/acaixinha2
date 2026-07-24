import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { SearchMemoriesUseCase } from "../../../memory/application/use-cases/SearchMemoriesUseCase.js";
import type { SearchMemoriesDTO } from "../../../memory/application/dto/SearchMemoriesDTO.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { searchMemoriesSchema } from "../../../shared/infrastructure/validation/schemas/memory.schemas.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class SearchMemoriesHandler {
  constructor(@inject(SearchMemoriesUseCase) private readonly useCase: SearchMemoriesUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    return new LambdaHandlerBuilder()
      .validate(searchMemoriesSchema)
      .handle(async (_event, parsed) => {
        const data = parsed as z.infer<typeof searchMemoriesSchema>;
        const filters: SearchMemoriesDTO = {
          text: data.text,
          tags: data.tags ? data.tags.split(",") : undefined,
          dateFrom: data.dateFrom,
          dateTo: data.dateTo,
          page: data.page ? parseInt(data.page, 10) : undefined,
          limit: data.limit ? parseInt(data.limit, 10) : undefined,
        };
        const result = await this.useCase.execute(ctx.userId, filters);
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(result) };
      })(event);
  }
}
