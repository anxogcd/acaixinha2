# 02 — Dominio: Módulo User

## Dependencias

- [01-setup-monorepo](./01-setup-monorepo.md) (shared package disponible)

## Descripción

Implementar la capa de dominio del módulo User siguiendo DDD y arquitectura hexagonal: Aggregate Root `User`, Value Objects con tipado nominal (branding), Domain Events, Domain Exceptions y el puerto `IUserRepository`.

## Criterios de Aceptación

- [ ] `User` aggregate extiende `AggregateRoot` base y registra eventos de dominio.
- [ ] Value Objects (`UserId`, `UserName`, `UserUsername`, `UserDescription`, `UserAvatarUrl`) usan branding nominal para evitar intercambio accidental de strings.
- [ ] Domain Events: `UserCreatedEvent`, `UserProfileUpdatedEvent`, `UserMemorySharedEvent`.
- [ ] Domain Exceptions: `UserNotFoundException`, `UserAlreadyExistsException`, `InvalidUsernameException`.
- [ ] `IUserRepository` (port) define contrato: `findById`, `findByUsername`, `save`, `delete`.
- [ ] Cero dependencias externas en esta capa (ni frameworks ni librerías de BD).

## Subtareas

### 2.1 — Clase base AggregateRoot

- Crear `packages/shared/src/domain/AggregateRoot.ts`.
- Propiedades: `id`, `createdAt`, `updatedAt`.
- Método `record(event: DomainEvent)` para registrar eventos internos.
- Método `pullEvents(): DomainEvent[]` para extraer eventos pendientes.
- Clase base `DomainEvent` con `eventId`, `occurredAt`, `aggregateId`.

### 2.2 — Value Objects con branding

- Crear clase base `StringVO<TBrand>` en `packages/shared/src/domain/value-objects/StringVO.ts`.
- Usar `declare private readonly _brand: TBrand` para tipado nominal.
- Validación en constructor (no vacío, longitud máxima, etc.) según configuración.

### 2.3 — Value Objects de User

- `UserId` (extiende `StringVO<'UserId'>`, valida UUID).
- `UserName` (extiende `StringVO<'UserName'>`, 1-100 chars).
- `UserUsername` (extiende `StringVO<'UserUsername'>`, patrón `@?[a-z0-9_]{3,30}`).
- `UserDescription` (extiende `StringVO<'UserDescription'>`, 0-500 chars, nullable).
- `UserAvatarUrl` (extiende `StringVO<'UserAvatarUrl'>`, valida S3 key pattern).

### 2.4 — Aggregate Root User

- `apps/api/src/user/domain/models/User.ts`.
- Propiedades: `id` (UserId), `name` (UserName), `username` (UserUsername), `avatarUrl` (UserAvatarUrl, opcional), `description` (UserDescription, opcional), `ownMemoryIds` (Set<string>), `sharedMemoryIds` (Set<string>).
- Factory method `static create(props): User` que dispara `UserCreatedEvent`.
- Método `updateProfile(name, avatarUrl, description): void` que dispara `UserProfileUpdatedEvent`.
- Método `addOwnMemory(memoryId: string): void`.
- Método `removeOwnMemory(memoryId: string): void`.
- Método `addSharedMemory(memoryId: string): void` que dispara `UserMemorySharedEvent`.
- Método `removeSharedMemory(memoryId: string): void`.

### 2.5 — Domain Events

- `UserCreatedEvent` con `userId`, `username`, `name`.
- `UserProfileUpdatedEvent` con `userId`, cambios parciales.
- `UserMemorySharedEvent` con `userId`, `memoryId`, `sharedByUserId`.

### 2.6 — Domain Exceptions

- `UserNotFoundException` (por id o username).
- `UserAlreadyExistsException` (username duplicado).
- `InvalidUsernameException` (formato inválido).

### 2.7 — Repository Port (IUserRepository)

- Interface en `apps/api/src/user/domain/repositories/IUserRepository.ts`.
- Métodos: `findById(id: UserId): Promise<User | null>`, `findByUsername(username: UserUsername): Promise<User | null>`, `save(user: User): Promise<void>`, `delete(id: UserId): Promise<void>`.
- DI Token: `DITOKEN_IUSER_REPOSITORY = Symbol('IUserRepository')`.

### 2.8 — Constantes y enums

- `apps/api/src/user/domain/constants/` — eventos, errores como constantes.

## Notas

- `ownMemoryIds` y `sharedMemoryIds` son arrays de strings (UUIDs de Memory), no referencias a objetos Memory. Esto mantiene los agregados desacoplados.
- El `sub` de Cognito se usa como `id` del User para alinear identidad de auth con dominio.
- Los VOs con branding evitan que pases un `UserId` donde se espera un `MemoryId` o viceversa.
