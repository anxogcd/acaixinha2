import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { SearchMemoriesHandler } from "../delivery/SearchMemoriesHandler.js";

const searchMemoriesHandler = container.resolve(SearchMemoriesHandler);
export const handler = withAuth(searchMemoriesHandler.handle.bind(searchMemoriesHandler));
