import { container } from "../../../shared/infrastructure/di/container.js";
import { CreateUserHandler } from "../delivery/CreateUserHandler.js";

const createUserHandler = container.resolve(CreateUserHandler);
export const handler = createUserHandler.handle.bind(createUserHandler);