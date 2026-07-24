import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { RemoveAttachmentHandler } from "../delivery/RemoveAttachmentHandler.js";

const removeAttachmentHandler = container.resolve(RemoveAttachmentHandler);
export const handler = withAuth(removeAttachmentHandler.handle.bind(removeAttachmentHandler));
