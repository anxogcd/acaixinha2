import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { CreateMemoryHandler } from "../delivery/CreateMemoryHandler.js";

const createMemoryHandler = container.resolve(CreateMemoryHandler);
export const handler = withAuth(createMemoryHandler.handle.bind(createMemoryHandler));
