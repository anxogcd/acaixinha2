import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { ListMemoriesHandler } from "../delivery/ListMemoriesHandler.js";

const listMemoriesHandler = container.resolve(ListMemoriesHandler);
export const handler = withAuth(listMemoriesHandler.handle.bind(listMemoriesHandler));
