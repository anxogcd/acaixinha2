import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetUserByIdUseCase } from "../../../user/application/use-cases/GetUserByIdUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

interface GetUserParams {
  userId: string;
}

@injectable()
export class GetUserHandler {
  constructor(@inject(GetUserByIdUseCase) private readonly useCase: GetUserByIdUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    const { userId } = (event.pathParameters ?? {}) as unknown as GetUserParams;
    return new LambdaHandlerBuilder()
      .handle(async () => {
        const result = await this.useCase.execute(userId);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(result),
        };
      })(event);
  }
}