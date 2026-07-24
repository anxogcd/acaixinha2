import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { ConfirmAttachmentHandler } from "../delivery/ConfirmAttachmentHandler.js";

const confirmAttachmentHandler = container.resolve(ConfirmAttachmentHandler);
export const handler = withAuth(confirmAttachmentHandler.handle.bind(confirmAttachmentHandler));