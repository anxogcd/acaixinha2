import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { DeleteMemoryHandler } from "../delivery/DeleteMemoryHandler.js";

const deleteMemoryHandler = container.resolve(DeleteMemoryHandler);
export const handler = withAuth(deleteMemoryHandler.handle.bind(deleteMemoryHandler));
