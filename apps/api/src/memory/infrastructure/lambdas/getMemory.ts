import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { GetMemoryHandler } from "../delivery/GetMemoryHandler.js";

const getMemoryHandler = container.resolve(GetMemoryHandler);
export const handler = withAuth(getMemoryHandler.handle.bind(getMemoryHandler));
