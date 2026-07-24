import "reflect-metadata";
import { container } from "tsyringe";
import { DITOKEN_ID_GENERATOR, DITOKEN_IEVENT_BUS } from "@acaixinha/shared";
import { DITOKEN_IUSER_REPOSITORY } from "../../../user/domain/repositories/IUserRepository.js";
import { DITOKEN_IMEMORY_REPOSITORY } from "../../../memory/domain/repositories/IMemoryRepository.js";
import { CryptoIdGenerator } from "../CryptoIdGenerator.js";
import { EventBridgeEventBus } from "../events/EventBridgeEventBus.js";
import { UserRepositoryImpl } from "../../../user/infrastructure/repositories/UserRepositoryImpl.js";
import { MemoryRepositoryImpl } from "../../../memory/infrastructure/repositories/MemoryRepositoryImpl.js";
import { S3Service } from "../storage/S3Service.js";
import { S3KeyGenerator } from "../storage/S3KeyGenerator.js";
import { FileValidator } from "../storage/FileValidator.js";

container.register(DITOKEN_ID_GENERATOR, { useClass: CryptoIdGenerator });
container.register(DITOKEN_IEVENT_BUS, { useClass: EventBridgeEventBus });
container.register(DITOKEN_IUSER_REPOSITORY, { useClass: UserRepositoryImpl });
container.register(DITOKEN_IMEMORY_REPOSITORY, { useClass: MemoryRepositoryImpl });
container.register(S3Service, { useClass: S3Service });
container.register(S3KeyGenerator, { useClass: S3KeyGenerator });
container.register(FileValidator, { useClass: FileValidator });

export { container };
