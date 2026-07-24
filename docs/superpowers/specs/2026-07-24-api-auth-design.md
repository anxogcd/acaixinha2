# 07 — Infraestructura: API Entry Points + Autenticación

## Overview

Implementar los entry points HTTP (Lambda handlers) para la API REST y la integración con Amazon Cognito para autenticación JWT. Cada endpoint de API Gateway mapea a una función Lambda que parsea la request, invoca el caso de uso correspondiente y devuelve la respuesta HTTP.

## Decisiones de diseño

| Decisión           | Opción elegida                                                  |
| ------------------ | --------------------------------------------------------------- |
| Patrón de handlers | Lambda nativo: `APIGatewayProxyEvent` → `APIGatewayProxyResult` |
| Autenticación      | `aws-jwt-verify` (validación remota contra Cognito)             |
| DI                 | Container tsyringe mínimo (se refina en task 09)                |
| Event bus          | `EventBridge` real con `@aws-sdk/client-eventbridge`            |

## Estructura de archivos

```
apps/api/src/
├── shared/infrastructure/
│   ├── auth/
│   │   ├── CognitoJwtVerifier.ts      # Factory lazy-init del verifier Cognito
│   │   └── withAuth.ts                # HOF que envuelve handlers con auth
│   ├── delivery/
│   │   ├── BaseLambdaHandler.ts       # Builder genérico parseo/validación/errores
│   │   ├── HttpErrorMapper.ts         # Domain exceptions → HTTP status codes
│   │   └── cors.ts                    # CORS headers
│   ├── events/
│   │   └── EventBridgeEventBus.ts     # IEventBus → EventBridge PutEvents
│   ├── di/
│   │   └── container.ts               # Registro tsyringe
│   └── validation/
│       └── schemas/
│           ├── user.schemas.ts        # createUser, updateUserProfile
│           └── memory.schemas.ts      # create/update/search/share/attachment
├── user/infrastructure/
│   ├── delivery/                      # Handlers HTTP
│   │   ├── CreateUserHandler.ts
│   │   ├── GetUserHandler.ts
│   │   ├── UpdateUserProfileHandler.ts
│   │   └── DeleteUserHandler.ts
│   └── lambdas/                       # Entry points (exportan handler)
│       ├── createUser.ts
│       ├── getUser.ts
│       ├── updateUserProfile.ts
│       └── deleteUser.ts
├── memory/infrastructure/
│   ├── delivery/
│   │   ├── CreateMemoryHandler.ts
│   │   ├── GetMemoryHandler.ts
│   │   ├── UpdateMemoryHandler.ts
│   │   ├── DeleteMemoryHandler.ts
│   │   ├── ListUserMemoriesHandler.ts
│   │   ├── SearchMemoriesHandler.ts
│   │   ├── ShareMemoryHandler.ts
│   │   ├── UnshareMemoryHandler.ts
│   │   ├── AddAttachmentHandler.ts
│   │   └── RemoveAttachmentHandler.ts
│   └── lambdas/
│       ├── createMemory.ts
│       ├── getMemory.ts
│       ├── updateMemory.ts
│       ├── deleteMemory.ts
│       ├── listMemories.ts
│       ├── searchMemories.ts
│       ├── shareMemory.ts
│       ├── unshareMemory.ts
│       ├── addAttachment.ts
│       └── removeAttachment.ts
└── auth/infrastructure/
    └── lambdas/
        └── postConfirmation.ts        # Cognito Post-Confirmation Trigger
```

## Flujo de cada request

```
API Gateway
  → Lambda handler (lambdas/*.ts)
    → withAuth (extrae JWT, verifica contra Cognito)
      → Zod validation (body/path/query params)
        → Handler (delivery/*.ts) ejecuta UseCase
          → Response + CORS headers
```

## 1. Zod Schemas (`shared/infrastructure/validation/schemas/`)

### `user.schemas.ts`

- `createUserSchema`: `id: uuid`, `name: 1-100 chars`, `username: /^@?[a-z0-9_]{3,30}$/`
- `updateUserProfileSchema`: `name?`, `avatarUrl?`, `description?: max 500`

### `memory.schemas.ts`

- `createMemorySchema`: `title: 1-200`, `description: 1-10000`, `memoryDate: ISO string`, `locationName?`, `coordinates?: {lat, lng}`, `tags?: string[]`
- `updateMemorySchema`: todos los campos opcionales, al menos uno requerido (con `.refine()`)
- `shareMemorySchema`: `targetUserId: uuid`
- `addAttachmentSchema`: `s3Key`, `mimeType`, `description?`
- `searchMemoriesSchema`: `text?`, `tags?`, `dateFrom?`, `dateTo?`, `page?`, `limit?`

## 2. Auth Middleware (`shared/infrastructure/auth/`)

### `CognitoJwtVerifier.ts`

- Singleton lazy-init usando `CognitoJwtVerifier.create()` de `aws-jwt-verify`.
- Config: `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_TOKEN_USE = "id"`.
- Expone `getVerifier(): CognitoJwtVerifier`.

### `withAuth.ts`

- Tipos: `AuthContext = { userId: string; claims: { sub: string; username: string; email: string } }`.
- `withAuth(handler: (event, ctx: AuthContext) => Promise<APIGatewayProxyResult>)`:
  - Extrae `Authorization` header (formato `Bearer <token>`). Si falta → 401.
  - Llama a `getVerifier().verify(token)`. Si falla → 401.
  - Construye `AuthContext` con `sub`, `username`, `email` del payload.
  - Llama al handler original con el contexto.
  - Captura errores inesperados y los convierte a 500.

## 3. BaseLambdaHandler + Error Mapping (`shared/infrastructure/delivery/`)

### `BaseLambdaHandler.ts`

Builder pattern con tipado genérico:

```typescript
class LambdaHandlerBuilder<T> {
  validate(schema: ZodSchema<T>): this;
  handle(
    fn: (
      event: APIGatewayProxyEvent,
      parsed: T,
      ctx?: AuthContext,
    ) => Promise<APIGatewayProxyResult>,
  ): LambdaHandler;
}
```

Flujo:

1. Parsea `body` (JSON.parse), `pathParameters`, `queryStringParameters` del evento.
2. Construye objeto combinado y valida con Zod. 400 si falla.
3. Ejecuta `fn`. Captura errores y mapea con `HttpErrorMapper`.
4. Respuesta siempre incluye CORS headers.

### `HttpErrorMapper.ts`

Mapea excepciones por su propiedad `code`:

| Error code                                                                            | HTTP |
| ------------------------------------------------------------------------------------- | ---- |
| `USER_NOT_FOUND`, `MEMORY_NOT_FOUND`                                                  | 404  |
| `USER_ALREADY_EXISTS`                                                                 | 409  |
| `UNAUTHORIZED_MEMORY_ACCESS`                                                          | 403  |
| `INVALID_USERNAME`, `INVALID_COORDINATES`, `INVALID_TAG`, `ATTACHMENT_LIMIT_EXCEEDED` | 400  |
| otros                                                                                 | 500  |

También soporta fallback por `instanceof` (e.g., `MemoryNotFoundException` → 404).

### `cors.ts`

Headers CORS constantes: `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers: Content-Type,Authorization`, `Access-Control-Allow-Methods: GET,POST,PATCH,DELETE,OPTIONS`.

## 4. User Handlers (`user/infrastructure/delivery/`)

| Handler                    | Método/Ruta            | Auth | Usa                        |
| -------------------------- | ---------------------- | ---- | -------------------------- |
| `CreateUserHandler`        | POST /users            | No   | `CreateUserUseCase`        |
| `GetUserHandler`           | GET /users/{userId}    | Sí   | `GetUserByIdUseCase`       |
| `UpdateUserProfileHandler` | PATCH /users/{userId}  | Sí   | `UpdateUserProfileUseCase` |
| `DeleteUserHandler`        | DELETE /users/{userId} | Sí   | `DeleteUserUseCase`        |

Cada handler es una clase inyectable con tsyringe que recibe el use case en el constructor. El método `handle(event)` devuelve `Promise<APIGatewayProxyResult>`.

## 5. Memory Handlers (`memory/infrastructure/delivery/`)

| Handler                   | Método/Ruta                                            | Auth |
| ------------------------- | ------------------------------------------------------ | ---- |
| `CreateMemoryHandler`     | POST /memories                                         | Sí   |
| `GetMemoryHandler`        | GET /memories/{memoryId}                               | Sí   |
| `UpdateMemoryHandler`     | PATCH /memories/{memoryId}                             | Sí   |
| `DeleteMemoryHandler`     | DELETE /memories/{memoryId}                            | Sí   |
| `ListUserMemoriesHandler` | GET /memories                                          | Sí   |
| `SearchMemoriesHandler`   | GET /memories/search                                   | Sí   |
| `ShareMemoryHandler`      | POST /memories/{memoryId}/share                        | Sí   |
| `UnshareMemoryHandler`    | DELETE /memories/{memoryId}/share/{userId}             | Sí   |
| `AddAttachmentHandler`    | POST /memories/{memoryId}/attachments                  | Sí   |
| `RemoveAttachmentHandler` | DELETE /memories/{memoryId}/attachments/{attachmentId} | Sí   |

## 6. Lambda Entry Points (`{module}/infrastructure/lambdas/`)

Cada archivo exporta un `handler`:

```typescript
export const handler = withAuth(
  // o sin withAuth si es público
  container.resolve(SomeHandler).handle.bind(container.resolve(SomeHandler)),
);
```

Para `createUser` (sin auth) se omite `withAuth`.

## 7. Cognito Post-Confirmation Trigger (`auth/infrastructure/lambdas/postConfirmation.ts`)

Trigger que Cognito invoca tras confirmación de registro:

- Recibe `PostConfirmationTriggerEvent`.
- Extrae `sub` (userId), `name` (`userName` o claim), `email` del evento.
- Llama a `CreateUserUseCase.execute(sub, name, email)`.
- Si el usuario ya existe (409, ya creado por otro trigger previo), ignora el error.
- Devuelve el evento (Cognito espera el evento de vuelta).

## 8. DI Container (`shared/infrastructure/di/container.ts`)

```typescript
import "reflect-metadata";
import { container } from "tsyringe";

// Shared
container.register(DITOKEN_ID_GENERATOR, { useClass: CryptoIdGenerator });
container.register(DITOKEN_IEVENT_BUS, { useClass: EventBridgeEventBus });

// Repositories
container.register(DITOKEN_IUSER_REPOSITORY, { useClass: UserRepositoryImpl });
container.register(DITOKEN_IMEMORY_REPOSITORY, { useClass: MemoryRepositoryImpl });
```

Los use cases, command handlers y query handlers se resuelven automáticamente vía `@injectable()`.

## 9. EventBridge (`shared/infrastructure/events/EventBridgeEventBus.ts`)

- `@injectable()`, implementa `IEventBus`.
- Usa `@aws-sdk/client-eventbridge` (`PutEventsCommand`).
- `publish(event)`: serializa a `{ Source: "acaixinha.api", DetailType: event.constructor.name, Detail: JSON.stringify(event), EventBusName: process.env.EVENT_BUS_NAME ?? "default" }`.
- Errores de EventBridge se loguean (stderr) pero no interrumpen el flujo.

## 10. Dependencias nuevas

- `zod` — validación de schemas
- `aws-jwt-verify` — verificación JWT contra Cognito
- `@aws-sdk/client-eventbridge` — publicación de eventos
- `@types/aws-lambda` — tipos para APIGatewayProxyEvent/Result
- `aws-lambda` — tipos para Cognito triggers (postConfirmation)

Instalar con `pnpm add --filter @acaixinha/api zod aws-jwt-verify @aws-sdk/client-eventbridge @types/aws-lambda aws-lambda`.

## 11. Variables de entorno requeridas

| Variable                       | Uso                                       |
| ------------------------------ | ----------------------------------------- |
| `DYNAMODB_USERS_TABLE`         | UserRepositoryImpl (ya usado)             |
| `DYNAMODB_MEMORIES_TABLE`      | MemoryRepositoryImpl (ya usado)           |
| `DYNAMODB_MEMORY_SHARES_TABLE` | MemoryRepositoryImpl (ya usado)           |
| `COGNITO_USER_POOL_ID`         | CognitoJwtVerifier                        |
| `COGNITO_CLIENT_ID`            | CognitoJwtVerifier                        |
| `S3_BUCKET_NAME`               | Memory handlers (task 08)                 |
| `EVENT_BUS_NAME`               | EventBridgeEventBus                       |
| `AWS_REGION`                   | DynamoDB, EventBridge (default eu-west-1) |

## 12. Notas de implementación

- La task especifica handlers Lambda individuales, pero el diseño también permite ejecución local vía Express adaptador (se añade en `localServer.ts` un modo dev que envuelve los handlers Lambda con un adaptador `lambdaEvent -> req/res`).
- `Memory.ts` usa `throw new Error()` en algunos casos (attachment limit), que se capturarán como 500. Se corregirán en esta task para que usen las excepciones de dominio correspondientes.
- Los handlers de attachments (task 08) se estructuran pero la lógica de S3 real se completa en la task 08 (presigned URLs, etc.). Aquí se deja el esqueleto con validación Zod.
