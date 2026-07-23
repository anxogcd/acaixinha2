# 04 — Aplicación: Módulo User (CQRS)

## Dependencias

- [02-domain-user](./02-domain-user.md) (modelos de dominio, puertos)

## Descripción

Implementar la capa de aplicación del módulo User usando CQRS: Commands, Queries, Handlers y Use Cases para crear/actualizar/consultar usuarios.

## Criterios de Aceptación

- [ ] Commands: `CreateUserCommand`, `UpdateUserProfileCommand`, `DeleteUserCommand`.
- [ ] Queries: `GetUserByIdQuery`, `GetUserByUsernameQuery`.
- [ ] Cada command/query tiene su handler correspondiente.
- [ ] Los handlers reciben dependencias vía constructor (inyectables por tsyringe).
- [ ] DTOs de entrada/salida definidos en `application/dto/`.
- [ ] Casos de uso publican eventos de dominio tras persistir (vía EventBus).

## Subtareas

### 4.1 — DTOs de User

- `apps/api/src/user/application/dto/CreateUserDTO.ts`: `{ id: string, name: string, username: string }`.
- `apps/api/src/user/application/dto/UpdateUserProfileDTO.ts`: `{ name?: string, avatarUrl?: string, description?: string }`.
- `apps/api/src/user/application/dto/UserResponseDTO.ts`: mapea User aggregate a objeto plano para respuestas API.
- `apps/api/src/user/application/dto/UserPaginatedResponseDTO.ts`.

### 4.2 — Commands

- `CreateUserCommand`: `{ id: string, name: string, username: string }`.
- `UpdateUserProfileCommand`: `{ userId: string, name?: string, avatarUrl?: string, description?: string }`.
- `DeleteUserCommand`: `{ userId: string }`.

### 4.3 — Command Handlers

- `CreateUserCommandHandler`: valida que el username no exista, crea el aggregate User, persiste vía `IUserRepository`, publica `UserCreatedEvent`.
- `UpdateUserProfileCommandHandler`: busca usuario, aplica `updateProfile()`, persiste, publica `UserProfileUpdatedEvent`.
- `DeleteUserCommandHandler`: busca usuario, elimina vía repositorio.

### 4.4 — Queries

- `GetUserByIdQuery`: `{ userId: string }`.
- `GetUserByUsernameQuery`: `{ username: string }`.

### 4.5 — Query Handlers

- `GetUserByIdQueryHandler`: busca por ID, mapea a `UserResponseDTO` o lanza `UserNotFoundException`.
- `GetUserByUsernameQueryHandler`: busca por username, mapea a `UserResponseDTO` o lanza `UserNotFoundException`.

### 4.6 — Use Cases

- `apps/api/src/user/application/use-cases/CreateUserUseCase.ts`: orquesta el flujo completo.
- `apps/api/src/user/application/use-cases/UpdateUserProfileUseCase.ts`.
- `apps/api/src/user/application/use-cases/DeleteUserUseCase.ts`.
- `apps/api/src/user/application/use-cases/GetUserByIdUseCase.ts`.
- `apps/api/src/user/application/use-cases/GetUserByUsernameUseCase.ts`.

### 4.7 — Mappers

- `apps/api/src/user/application/mappers/UserMapper.ts`.
- `toDomain(dto: CreateUserDTO): User` — construye el aggregate desde DTO.
- `toResponse(user: User): UserResponseDTO` — convierte aggregate a DTO de respuesta.

### 4.8 — Event Bus interface

- `packages/shared/src/domain/events/IEventBus.ts`.
- Interfaz `IEventBus` con `publish(event: DomainEvent): Promise<void>`.
- DI Token `DITOKEN_IEVENT_BUS`.

## Notas

- La creación de usuario se dispara desde el trigger post-confirmación de Cognito (infra), pero la lógica de dominio reside aquí.
- Los use cases no dependen de Lambda ni HTTP; son agnósticos del entry point.
- tsyringe inyectará `IUserRepository` y `IEventBus` en los handlers.
