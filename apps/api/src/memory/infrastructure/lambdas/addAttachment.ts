import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { AddAttachmentHandler } from "../delivery/AddAttachmentHandler.js";

const addAttachmentHandler = container.resolve(AddAttachmentHandler);
export const handler = withAuth(addAttachmentHandler.handle.bind(addAttachmentHandler));
