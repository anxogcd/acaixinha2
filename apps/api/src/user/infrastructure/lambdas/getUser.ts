import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { GetUserHandler } from "../delivery/GetUserHandler.js";

const getUserHandler = container.resolve(GetUserHandler);
export const handler = withAuth(getUserHandler.handle.bind(getUserHandler));
