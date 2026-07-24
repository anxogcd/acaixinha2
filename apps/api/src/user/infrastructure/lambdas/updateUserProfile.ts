import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { UpdateUserProfileHandler } from "../delivery/UpdateUserProfileHandler.js";

const updateUserProfileHandler = container.resolve(UpdateUserProfileHandler);
export const handler = withAuth(updateUserProfileHandler.handle.bind(updateUserProfileHandler));
