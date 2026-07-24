import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { UnshareMemoryHandler } from "../delivery/UnshareMemoryHandler.js";

const unshareMemoryHandler = container.resolve(UnshareMemoryHandler);
export const handler = withAuth(unshareMemoryHandler.handle.bind(unshareMemoryHandler));
