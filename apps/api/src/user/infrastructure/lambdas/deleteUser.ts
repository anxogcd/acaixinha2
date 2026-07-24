import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { DeleteUserHandler } from "../delivery/DeleteUserHandler.js";

const deleteUserHandler = container.resolve(DeleteUserHandler);
export const handler = withAuth(deleteUserHandler.handle.bind(deleteUserHandler));
