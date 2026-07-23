# 05 — Aplicación: Módulo Memory (CQRS)

## Dependencias

- [03-domain-memory](./03-domain-memory.md) (modelos de dominio, puertos)
- [04-application-user](./04-application-user.md) (patrones CQRS establecidos)

## Descripción

Implementar la capa de aplicación del módulo Memory usando CQRS: CRUD completo, búsqueda avanzada, compartición y gestión de attachments.

## Criterios de Aceptación

- [ ] Commands: `CreateMemory`, `UpdateMemory`, `DeleteMemory`, `ShareMemory`, `UnshareMemory`, `AddAttachment`, `RemoveAttachment`.
- [ ] Queries: `GetMemoryById`, `GetUserMemories`, `SearchMemories`.
- [ ] Validación de permisos en cada handler (owner vs shared user).
- [ ] Un usuario compartido solo puede añadir attachments, no modificar el memory ni borrar attachments ajenos.
- [ ] Eliminar un memory actualiza `ownMemoryIds` del owner y `sharedMemoryIds` de usuarios compartidos.

## Subtareas

### 5.1 — DTOs de Memory

- `apps/api/src/memory/application/dto/CreateMemoryDTO.ts`: `{ title, description, memoryDate, locationName?, coordinates?, tags? }`.
- `apps/api/src/memory/application/dto/UpdateMemoryDTO.ts`: campos opcionales de texto, tags y fechas (no attachments).
- `apps/api/src/memory/application/dto/MemoryResponseDTO.ts`: mapeo completo incluyendo attachments.
- `apps/api/src/memory/application/dto/MemoryPaginatedResponseDTO.ts`.
- `apps/api/src/memory/application/dto/SearchMemoriesDTO.ts`: `{ text?, tags?, dateFrom?, dateTo?, page?, limit? }`.
- `apps/api/src/memory/application/dto/ShareMemoryDTO.ts`: `{ memoryId, targetUserId }`.
- `apps/api/src/memory/application/dto/AddAttachmentDTO.ts`: `{ memoryId, s3Key, mimeType, description }`.

### 5.2 — Commands

- `CreateMemoryCommand`: `{ ownerId, title, description, memoryDate, locationName?, coordinates?, tags? }`.
- `UpdateMemoryCommand`: `{ memoryId, requestingUserId, title?, description?, memoryDate?, locationName?, coordinates?, tags? }`.
- `DeleteMemoryCommand`: `{ memoryId, requestingUserId }`.
- `ShareMemoryCommand`: `{ memoryId, requestingUserId, targetUserId }`.
- `UnshareMemoryCommand`: `{ memoryId, requestingUserId, targetUserId }`.
- `AddAttachmentCommand`: `{ memoryId, requestingUserId, s3Key, mimeType, description }`.
- `RemoveAttachmentCommand`: `{ memoryId, attachmentId, requestingUserId }`.

### 5.3 — Command Handlers

- `CreateMemoryCommandHandler`: crea Memory, persiste, añade a `ownMemoryIds` del owner, publica evento.
- `UpdateMemoryCommandHandler`: verifica que `requestingUserId === ownerId`, aplica cambios, persiste.
- `DeleteMemoryCommandHandler`: verifica propiedad, elimina memory, limpia referencias en usuarios (ownMemoryIds + sharedMemoryIds), publica evento.
- `ShareMemoryCommandHandler`: verifica propiedad, usa `MemorySharingService` para compartir, persiste ambos agregados.
- `UnshareMemoryCommandHandler`: inverso de share.
- `AddAttachmentCommandHandler`: verifica `canUserAddAttachment`, crea Attachment, añade al memory, persiste.
- `RemoveAttachmentCommandHandler`: verifica que el usuario es owner o uploader del attachment, elimina, persiste.

### 5.4 — Queries

- `GetMemoryByIdQuery`: `{ memoryId, requestingUserId }`.
- `GetUserMemoriesQuery`: `{ userId }` — feed principal (own + shared).
- `SearchMemoriesQuery`: `{ userId, filters: SearchMemoriesDTO }`.

### 5.5 — Query Handlers

- `GetMemoryByIdQueryHandler`: verifica que el usuario es owner o está en sharedWith, mapea a DTO.
- `GetUserMemoriesQueryHandler`: busca por `ownMemoryIds` + `sharedMemoryIds` del usuario.
- `SearchMemoriesQueryHandler`: aplica filtros combinados (texto, tags, rango de fechas) solo sobre memories accesibles por el usuario.

### 5.6 — Use Cases

- `apps/api/src/memory/application/use-cases/CreateMemoryUseCase.ts`.
- `apps/api/src/memory/application/use-cases/UpdateMemoryUseCase.ts`.
- `apps/api/src/memory/application/use-cases/DeleteMemoryUseCase.ts`.
- `apps/api/src/memory/application/use-cases/ShareMemoryUseCase.ts`.
- `apps/api/src/memory/application/use-cases/AddAttachmentUseCase.ts`.
- `apps/api/src/memory/application/use-cases/RemoveAttachmentUseCase.ts`.
- `apps/api/src/memory/application/use-cases/SearchMemoriesUseCase.ts`.

### 5.7 — Mappers

- `apps/api/src/memory/application/mappers/MemoryMapper.ts`.
- `toDomain(dto: CreateMemoryDTO): Memory`.
- `toResponse(memory: Memory): MemoryResponseDTO`.
- `attachmentToResponse(attachment: Attachment): AttachmentResponseDTO`.

## Notas

- `SearchMemories` es la query más compleja. En DynamoDB, se implementará con un GSI sobre `ownerId` + filtros en aplicación para texto/tags/fechas, o mediante un índice de búsqueda adicional si se necesita.
- Los permisos se validan en capa de aplicación, no en dominio (el dominio proporciona los métodos `isOwner`, `isSharedWith`, `canUserAddAttachment`).
- Cada handler recibe `IUserRepository`, `IMemoryRepository` y `IEventBus` vía constructor.
