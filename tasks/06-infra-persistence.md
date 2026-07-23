# 06 — Infraestructura: Persistencia (DynamoDB)

## Dependencias

- [02-domain-user](./02-domain-user.md) (IUserRepository port)
- [03-domain-memory](./03-domain-memory.md) (IMemoryRepository port)
- [04-application-user](./04-application-user.md) (DTOs y mappers de aplicación)
- [05-application-memory](./05-application-memory.md) (DTOs y mappers de aplicación)

## Descripción

Implementar los adaptadores de persistencia para DynamoDB: entidades de base de datos, mappers dominio↔persistencia, e implementaciones concretas de `IUserRepository` y `IMemoryRepository` usando el SDK de AWS DynamoDB v3.

## Criterios de Aceptación

- [ ] Tablas DynamoDB definidas con PK, SK, GSIs necesarios.
- [ ] Entidades de persistencia (`UserEntity`, `MemoryEntity`) separadas de los modelos de dominio.
- [ ] Mappers bidireccionales: `UserEntity <-> User`, `MemoryEntity <-> Memory`.
- [ ] Repositorios implementan los puertos de dominio y lanzan excepciones de dominio cuando corresponde.
- [ ] DynamoDB Client configurable vía variables de entorno (para local/testing).

## Subtareas

### 6.1 — Instalar dependencias

- `apps/api/package.json`: añadir `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/util-dynamodb`.
- `pnpm install --filter @acaixinha/api`.

### 6.2 — Diseño de tablas DynamoDB

- **Tabla Users**: PK = `id` (string, UUID = Cognito sub).
- **Tabla Memories**: PK = `id` (string, UUID).
  - GSI1: `ownerId-index` (PK = `ownerId`, SK = `memoryDate`) para feed del owner.
  - GSI2: `sharedWith-index` (PK = `sharedWithUserId`, SK = `memoryDate`) para feed de memorias compartidas.
- Alternativa: **Single Table Design** con PK/SK sobrecargados si se prefiere minimizar tablas.

### 6.3 — Entidades de persistencia

- `apps/api/src/user/infrastructure/entities/UserEntity.ts`: tipo plano con atributos DynamoDB (id, name, username, avatarUrl, description, ownMemoryIds, sharedMemoryIds, createdAt, updatedAt).
- `apps/api/src/memory/infrastructure/entities/MemoryEntity.ts`: tipo plano con atributos DynamoDB (id, title, description, memoryDate, locationName, coordinates_lat, coordinates_lng, ownerId, tags, sharedWithUserIds, attachments, createdAt, updatedAt).

### 6.4 — Mappers de persistencia

- `apps/api/src/user/infrastructure/repositories/UserMapper.ts`:
  - `toDomain(entity: UserEntity): User`.
  - `toPersistence(user: User): UserEntity`.
- `apps/api/src/memory/infrastructure/repositories/MemoryMapper.ts`:
  - `toDomain(entity: MemoryEntity): Memory`.
  - `toPersistence(memory: Memory): MemoryEntity`.
  - Manejar `Attachments` como array de objetos dentro del item de Memory.

### 6.5 — DynamoDB Client factory

- `apps/api/src/shared/infrastructure/persistence/DynamoDBClientFactory.ts`.
- Crear y cachear instancia de `DynamoDBDocumentClient` (v3).
- Configurable vía `DYNAMODB_ENDPOINT` (para DynamoDB Local en desarrollo) y `AWS_REGION`.

### 6.6 — UserRepositoryImpl

- `apps/api/src/user/infrastructure/repositories/UserRepositoryImpl.ts`.
- Implementa `IUserRepository`.
- `findById`: `GetCommand` sobre tabla Users con PK = id.
- `findByUsername`: `ScanCommand` con `FilterExpression = "username = :username"` o GSI si se crea uno.
- `save`: `PutCommand`.
- `delete`: `DeleteCommand`.

### 6.7 — MemoryRepositoryImpl

- `apps/api/src/memory/infrastructure/repositories/MemoryRepositoryImpl.ts`.
- Implementa `IMemoryRepository`.
- `findById`: `GetCommand` sobre tabla Memories.
- `findByOwner`: `QueryCommand` sobre GSI1 `ownerId-index`.
- `findBySharedWith`: `QueryCommand` sobre GSI2 `sharedWith-index` (requiere que `sharedWithUserIds` se pueda consultar eficientemente — considerar diseño alternativo si DynamoDB no soporta contains en GSI).
- `search`: combinación de queries según filtros.
- `save`: `PutCommand`.
- `delete`: `DeleteCommand`.

### 6.8 — DynamoDB Local para desarrollo

- Script docker-compose o script npm para levantar DynamoDB Local.
- Configuración de tablas automática al iniciar (opcional, puede ir en IaC o script separado).
- Tests de integración usarán DynamoDB Local.

## Notas

- **Importante**: DynamoDB no soporta queries con `contains` en GSIs de forma nativa. Para `sharedWithUserIds`, considerar:
  - Opción A: Tabla separada `MemoryShares` con PK = `userId`, SK = `memoryId` (recomendado para MVP).
  - Opción B: Duplicar cada memory por cada shared user (explosión de escritura).
  - Se usará la Opción A por simplicidad y escalabilidad.
- Las tablas se crearán vía Terraform (task 11), aquí solo implementamos los repositorios que las usan.
