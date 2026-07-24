import type { PostConfirmationTriggerEvent } from "aws-lambda";
import { container } from "../../../shared/infrastructure/di/container.js";
import { CreateUserUseCase } from "../../../user/application/use-cases/CreateUserUseCase.js";

export async function handler(event: PostConfirmationTriggerEvent): Promise<PostConfirmationTriggerEvent> {
  const useCase = container.resolve(CreateUserUseCase);

  try {
    const sub = event.request.userAttributes.sub;
    const email = event.request.userAttributes.email ?? event.userName;
    const name = event.request.userAttributes.name ?? event.userName;

    await useCase.execute(sub, name, email);
  } catch (err) {
    if (
      err instanceof Error &&
      (err as { code?: string }).code === "USER_ALREADY_EXISTS"
    ) {
      console.log("User already exists, skipping creation");
    } else {
      console.error("Failed to create user in post-confirmation trigger:", err);
    }
  }

  return event;
}
