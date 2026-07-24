import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { GenerateUploadUrlHandler } from "../delivery/GenerateUploadUrlHandler.js";

const generateUploadUrlHandler = container.resolve(GenerateUploadUrlHandler);
export const handler = withAuth(generateUploadUrlHandler.handle.bind(generateUploadUrlHandler));