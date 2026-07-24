import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetUserMemoriesUseCase } from "../../../memory/application/use-cases/GetUserMemoriesUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class ListMemoriesHandler {
  constructor(@inject(GetUserMemoriesUseCase) private readonly useCase: GetUserMemoriesUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    return new LambdaHandlerBuilder()
      .handle(async () => {
        const result = await this.useCase.execute(ctx.userId);
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(result) };
      })(event);
  }
}