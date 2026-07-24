import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { GenerateDownloadUrlHandler } from "../delivery/GenerateDownloadUrlHandler.js";

const generateDownloadUrlHandler = container.resolve(GenerateDownloadUrlHandler);
export const handler = withAuth(generateDownloadUrlHandler.handle.bind(generateDownloadUrlHandler));