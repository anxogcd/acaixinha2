# 03 — Dominio: Módulo Memory + Attachment

## Dependencias

- [02-domain-user](./02-domain-user.md) (AggregateRoot base, patrones de VO)

## Descripción

Implementar la capa de dominio del módulo Memory y Attachment: Aggregate Root `Memory`, Value Objects, entidad local `Attachment`, Domain Events, Domain Exceptions y el puerto `IMemoryRepository`.

## Criterios de Aceptación

- [ ] `Memory` aggregate extiende `AggregateRoot`.
- [ ] `Attachment` es una entidad local dentro del agregado Memory (no un aggregate independiente).
- [ ] Value Objects con branding: `MemoryId`, `MemoryTitle`, `MemoryDescription`, `LocationName`, `Coordinates`, `Tag`, `AttachmentId`, `S3Key`, `MimeType`.
- [ ] Domain Events: `MemoryCreatedEvent`, `MemoryUpdatedEvent`, `MemoryDeletedEvent`, `MemorySharedEvent`, `AttachmentAddedEvent`.
- [ ] Domain Exceptions: `MemoryNotFoundException`, `UnauthorizedMemoryAccessException`, `AttachmentLimitExceededException`.
- [ ] `IMemoryRepository` define el contrato de persistencia.
- [ ] Coordenadas se validan (latitud -90..90, longitud -180..180).

## Subtareas

### 3.1 — Value Objects de Memory

- `MemoryId` (extiende `StringVO<'MemoryId'>`, valida UUID).
- `MemoryTitle` (extiende `StringVO<'MemoryTitle'>`, 1-200 chars, no vacío).
- `MemoryDescription` (extiende `StringVO<'MemoryDescription'>`, 0-10000 chars).
- `LocationName` (extiende `StringVO<'LocationName'>`, 0-200 chars, opcional).
- `Coordinates`: VO compuesto con `latitude: number` (-90..90) y `longitude: number` (-180..180). No extiende StringVO, es un VO propio con `equals()`.
- `Tag` (extiende `StringVO<'Tag'>`, 1-50 chars, lowercase, sin espacios, patrón `[a-z0-9_-]+`).

### 3.2 — Value Objects de Attachment

- `AttachmentId` (extiende `StringVO<'AttachmentId'>`, valida UUID).
- `S3Key` (extiende `StringVO<'S3Key'>`, patrón de ruta S3 válida).
- `MimeType` (extiende `StringVO<'MimeType'>`, valida contra lista de MIME types permitidos: image/_, video/_, audio/*, application/pdf).
- `AttachmentDescription` (extiende `StringVO<'AttachmentDescription'>`, 0-500 chars).

### 3.3 — Entidad local: Attachment

- `apps/api/src/memory/domain/models/Attachment.ts`.
- Propiedades: `id` (AttachmentId), `s3Key` (S3Key), `mimeType` (MimeType), `description` (AttachmentDescription), `uploadedByUserId` (string - referencia a UserId), `uploadedAt` (Date).
- Factory method `static create(props): Attachment`.
- Pertenece exclusivamente al agregado Memory (no tiene repositorio propio).

### 3.4 — Aggregate Root Memory

- `apps/api/src/memory/domain/models/Memory.ts`.
- Propiedades: `id` (MemoryId), `title` (MemoryTitle), `description` (MemoryDescription), `memoryDate` (Date), `locationName` (LocationName, opcional), `coordinates` (Coordinates, opcional), `ownerId` (string, ref a User), `tags` (Set<Tag>), `sharedWithUserIds` (Set<string>), `attachments` (Attachment[]).
- Factory `static create(props): Memory` dispara `MemoryCreatedEvent`.
- `updateDetails(title?, description?, memoryDate?, locationName?, coordinates?, tags?): void` dispara `MemoryUpdatedEvent`.
- `addTag(tag: Tag): void`.
- `removeTag(tag: Tag): void`.
- `shareWithUser(userId: string): void` dispara `MemorySharedEvent`.
- `unshareWithUser(userId: string): void`.
- `addAttachment(attachment: Attachment): void` dispara `AttachmentAddedEvent`.
- `removeAttachment(attachmentId: AttachmentId, requestingUserId: string): void` — solo el owner o el uploader pueden borrar.
- `isOwner(userId: string): boolean`.
- `isSharedWith(userId: string): boolean`.
- `canUserAddAttachment(userId: string): boolean` — owner o usuarios compartidos.
- `delete(): void` dispara `MemoryDeletedEvent` (solo owner).

### 3.5 — Domain Events

- `MemoryCreatedEvent` con `memoryId`, `ownerId`, `title`.
- `MemoryUpdatedEvent` con `memoryId`, campos modificados.
- `MemoryDeletedEvent` con `memoryId`, `ownerId`.
- `MemorySharedEvent` con `memoryId`, `sharedWithUserId`, `sharedByUserId`.
- `AttachmentAddedEvent` con `memoryId`, `attachmentId`, `uploadedByUserId`.

### 3.6 — Domain Exceptions

- `MemoryNotFoundException`.
- `UnauthorizedMemoryAccessException` (usuario no es owner ni está en sharedWith).
- `AttachmentLimitExceededException` (límite configurable, ej. 20 attachments por memory).
- `InvalidCoordinatesException`.
- `InvalidTagException`.

### 3.7 — Repository Port (IMemoryRepository)

- Interface en `apps/api/src/memory/domain/repositories/IMemoryRepository.ts`.
- Métodos: `findById(id: MemoryId): Promise<Memory | null>`, `findByOwner(ownerId: string): Promise<Memory[]>`, `findBySharedWith(userId: string): Promise<Memory[]>`, `search(filters: MemorySearchFilters): Promise<Memory[]>`, `save(memory: Memory): Promise<void>`, `delete(id: MemoryId): Promise<void>`.
- `MemorySearchFilters`: `{ text?: string, tags?: string[], dateFrom?: Date, dateTo?: Date, ownerId?: string }`.
- DI Token: `DITOKEN_IMEMORY_REPOSITORY = Symbol('IMemoryRepository')`.

### 3.8 — Domain Service

- `MemorySharingService` en `apps/api/src/memory/domain/services/MemorySharingService.ts`.
- `shareMemory(memory: Memory, targetUser: User): void` — añade userId a `sharedWithUserIds` del memory y memoryId a `sharedMemoryIds` del user.
- `unshareMemory(memory: Memory, targetUser: User): void` — inverso.

## Notas

- El límite de attachments por memory es una regla de negocio del dominio, no de infraestructura.
- `Coordinates` es opcional; un recuerdo puede no tener ubicación.
- La firma `canUserAddAttachment` es clave para los permisos granulares del MVP: invitados solo pueden añadir attachments.
