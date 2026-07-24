import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { UpdateMemoryHandler } from "../delivery/UpdateMemoryHandler.js";

const updateMemoryHandler = container.resolve(UpdateMemoryHandler);
export const handler = withAuth(updateMemoryHandler.handle.bind(updateMemoryHandler));
