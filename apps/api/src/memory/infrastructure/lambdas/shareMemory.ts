import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { ShareMemoryHandler } from "../delivery/ShareMemoryHandler.js";

const shareMemoryHandler = container.resolve(ShareMemoryHandler);
export const handler = withAuth(shareMemoryHandler.handle.bind(shareMemoryHandler));
