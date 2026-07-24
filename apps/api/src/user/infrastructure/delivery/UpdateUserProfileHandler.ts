import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { UpdateUserProfileUseCase } from "../../../user/application/use-cases/UpdateUserProfileUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { updateUserProfileSchema } from "../../../shared/infrastructure/validation/schemas/user.schemas.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class UpdateUserProfileHandler {
  constructor(@inject(UpdateUserProfileUseCase) private readonly useCase: UpdateUserProfileUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    return new LambdaHandlerBuilder()
      .validate(updateUserProfileSchema)
      .handle(async (_event, parsed) => {
        const { name, avatarUrl, description } = parsed as z.infer<typeof updateUserProfileSchema>;
        const result = await this.useCase.execute(
          ctx.userId,
          name,
          avatarUrl,
          description,
        );
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(result),
        };
      })(event);
  }
}