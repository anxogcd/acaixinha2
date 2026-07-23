# 07 — Infraestructura: API Entry Points + Autenticación

## Dependencias

- [04-application-user](./04-application-user.md) (use cases de User)
- [05-application-memory](./05-application-memory.md) (use cases de Memory)
- [06-infra-persistence](./06-infra-persistence.md) (repositorios implementados)

## Descripción

Implementar los entry points HTTP (Lambda handlers) para la API REST y la integración con Amazon Cognito para autenticación JWT. Cada endpoint de API Gateway mapea a una función Lambda que parsea la request, invoca el caso de uso correspondiente y devuelve la respuesta HTTP.

## Criterios de Aceptación

- [ ] Lambda handlers para todos los endpoints de User y Memory.
- [ ] Middleware de autenticación que valida JWT de Cognito y extrae `sub` (userId).
- [ ] Manejo de errores centralizado: domain exceptions → HTTP status codes.
- [ ] Request/Response parsing con validación (usando Zod).
- [ ] CORS configurado correctamente para el frontend.

## Subtareas

### 7.1 — Instalar dependencias

- `apps/api/package.json`: añadir `zod`, `aws-jwt-verify`, `jose` (opcional, para decodificar JWT sin verificar si es necesario).
- `pnpm install --filter @acaixinha/api`.

### 7.2 — Esquemas de validación (Zod)

- `apps/api/src/shared/infrastructure/validation/schemas/`.
- `createUserSchema`, `updateUserProfileSchema`.
- `createMemorySchema`, `updateMemorySchema`, `searchMemoriesSchema`.
- `shareMemorySchema`, `addAttachmentSchema`.
- Validación de UUIDs, coordenadas, tags, MIME types.

### 7.3 — Middleware de autenticación Cognito

- `apps/api/src/shared/infrastructure/auth/CognitoJwtVerifier.ts`.
- Usa `CognitoJwtVerifier` de `aws-jwt-verify`.
- Configurable con `COGNITO_USER_POOL_ID` y `COGNITO_CLIENT_ID`.
- Middleware `withAuth(handler)` que:
  - Extrae `Authorization: Bearer <token>` del header.
  - Verifica el token contra Cognito.
  - Extrae `sub`, `username`, `email` del payload.
  - Inyecta `userId` y `claims` en el contexto.

### 7.4 — Base Lambda Handler

- `apps/api/src/shared/infrastructure/delivery/BaseLambdaHandler.ts`.
- Wrapper genérico que:
  - Parsea el body/query params/path params del evento de API Gateway.
  - Valida con Zod (devuelve 400 si falla).
  - Ejecuta el handler.
  - Atrapa domain exceptions y las mapea a HTTP status codes.
  - Devuelve respuesta con CORS headers.

### 7.5 — Mapeo de errores HTTP

- `apps/api/src/shared/infrastructure/delivery/HttpErrorMapper.ts`.
- `UserNotFoundException` → 404.
- `MemoryNotFoundException` → 404.
- `UserAlreadyExistsException` → 409.
- `UnauthorizedMemoryAccessException` → 403.
- `InvalidUsernameException` → 400.
- `AttachmentLimitExceededException` → 400.
- Error genérico → 500.

### 7.6 — User Lambda Handlers

- `apps/api/src/user/infrastructure/delivery/`.
- `CreateUserHandler` (POST /users) — trigger de Cognito o admin.
- `GetUserHandler` (GET /users/{userId}).
- `UpdateUserProfileHandler` (PATCH /users/{userId}).
- `DeleteUserHandler` (DELETE /users/{userId}).
- Todos autenticados excepto `CreateUserHandler` (que viene de Cognito trigger con token especial).

### 7.7 — Memory Lambda Handlers

- `apps/api/src/memory/infrastructure/delivery/`.
- `CreateMemoryHandler` (POST /memories).
- `GetMemoryHandler` (GET /memories/{memoryId}).
- `UpdateMemoryHandler` (PATCH /memories/{memoryId}).
- `DeleteMemoryHandler` (DELETE /memories/{memoryId}).
- `ListUserMemoriesHandler` (GET /memories — feed del usuario autenticado).
- `SearchMemoriesHandler` (GET /memories/search).
- `ShareMemoryHandler` (POST /memories/{memoryId}/share).
- `UnshareMemoryHandler` (DELETE /memories/{memoryId}/share/{userId}).
- `AddAttachmentHandler` (POST /memories/{memoryId}/attachments).
- `RemoveAttachmentHandler` (DELETE /memories/{memoryId}/attachments/{attachmentId}).

### 7.8 — Lambda entry points (index files)

- `apps/api/src/lambdas/users/createUser.ts`.
- `apps/api/src/lambdas/users/getUser.ts`.
- `apps/api/src/lambdas/users/updateUserProfile.ts`.
- `apps/api/src/lambdas/users/deleteUser.ts`.
- `apps/api/src/lambdas/memories/createMemory.ts`.
- `apps/api/src/lambdas/memories/getMemory.ts`.
- `apps/api/src/lambdas/memories/updateMemory.ts`.
- `apps/api/src/lambdas/memories/deleteMemory.ts`.
- `apps/api/src/lambdas/memories/listMemories.ts`.
- `apps/api/src/lambdas/memories/searchMemories.ts`.
- `apps/api/src/lambdas/memories/shareMemory.ts`.
- `apps/api/src/lambdas/memories/unshareMemory.ts`.
- `apps/api/src/lambdas/memories/addAttachment.ts`.
- `apps/api/src/lambdas/memories/removeAttachment.ts`.
- Cada archivo exporta un `handler` que es la función Lambda (compatible con API Gateway proxy integration).

### 7.9 — Cognito Post-Confirmation Trigger

- `apps/api/src/lambdas/auth/postConfirmation.ts`.
- Trigger que se ejecuta tras que un usuario confirme su registro en Cognito.
- Crea el User en DynamoDB usando `CreateUserUseCase`.
- El `sub` de Cognito se usa como `id` del User.

## Notas

- Cada Lambda es un archivo independiente para minimizar el tamaño del bundle (cold start).
- Se puede usar `@vercel/ncc` o `esbuild` para empaquetar cada Lambda en un solo archivo.
- La configuración de API Gateway (rutas, métodos, integraciones) va en Terraform (task 11).
- Las Lambdas requieren variables de entorno: `DYNAMODB_TABLE_USERS`, `DYNAMODB_TABLE_MEMORIES`, `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `S3_BUCKET_NAME`.
