# 07 — API Entry Points + Auth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Lambda handlers for all User and Memory endpoints with Cognito JWT auth, Zod validation, HTTP error mapping, DI container, and EventBridge event bus.

**Architecture:** Each Lambda entry point lives in its module's `infrastructure/lambdas/` folder and exports a `handler` function. Handlers use `withAuth` HOF for JWT validation, `LambdaHandlerBuilder` for Zod validation + error mapping, and tsyringe DI for dependency resolution. All use cases/command handlers/query handlers are already built.

**Tech Stack:** TypeScript 6, tsyringe 4, Zod, aws-jwt-verify, @aws-sdk/client-eventbridge, Express 4 (dev only)

## Global Constraints

- All imports use `.js` extensions (NodeNext/ESM module resolution)
- TypeScript `strict: true`, `experimentalDecorators: true`, `emitDecoratorMetadata: true`
- All DI is via tsyringe `@injectable()` + `@inject()` decorators
- Domain exceptions have a `readonly code: string` property used for HTTP mapping
- Lambda handlers accept `APIGatewayProxyEvent` and return `Promise<APIGatewayProxyResult>`
- Environment variables: `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `EVENT_BUS_NAME`, `DYNAMODB_USERS_TABLE`, `DYNAMODB_MEMORIES_TABLE`, `DYNAMODB_MEMORY_SHARES_TABLE`

---

### Task 1: Install dependencies

**Files:**
- Modify: `apps/api/package.json`

- [ ] Run install

```bash
pnpm add --filter @acaixinha/api zod aws-jwt-verify @aws-sdk/client-eventbridge && pnpm add --filter @acaixinha/api -D @types/aws-lambda aws-lambda
```

- [ ] Verify package.json updated

```bash
cat apps/api/package.json | grep -E "zod|aws-jwt-verify|client-eventbridge|@types/aws-lambda|aws-lambda"
```

Expected: all 5 packages listed in dependencies/devDependencies.

- [ ] Commit

```bash
git add apps/api/package.json pnpm-lock.yaml
git commit -m "chore(api): add zod, aws-jwt-verify, @aws-sdk/client-eventbridge, @types/aws-lambda"
```

---

### Task 2: CORS helper + HttpErrorMapper

**Files:**
- Create: `apps/api/src/shared/infrastructure/delivery/cors.ts`
- Create: `apps/api/src/shared/infrastructure/delivery/HttpErrorMapper.ts`

**Interfaces:**
- Produces: `corsHeaders` (constant Record<string,string>), `mapErrorToHttpResponse(error: Error): APIGatewayProxyResult`

- [ ] **Create `cors.ts`**

```typescript
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
} as const;
```

- [ ] **Create `HttpErrorMapper.ts`**

```typescript
import type { APIGatewayProxyResult } from "aws-lambda";
import { corsHeaders } from "./cors.js";

interface DomainError extends Error {
  code?: string;
}

const STATUS_MAP: Record<string, number> = {
  USER_NOT_FOUND: 404,
  MEMORY_NOT_FOUND: 404,
  USER_ALREADY_EXISTS: 409,
  UNAUTHORIZED_MEMORY_ACCESS: 403,
  INVALID_USERNAME: 400,
  INVALID_COORDINATES: 400,
  INVALID_TAG: 400,
  ATTACHMENT_LIMIT_EXCEEDED: 400,
};

export function mapErrorToHttpResponse(error: Error): APIGatewayProxyResult {
  const domainError = error as DomainError;
  const statusCode = (domainError.code && STATUS_MAP[domainError.code]) || 500;

  if (statusCode === 500) {
    console.error("Unhandled error:", error);
  }

  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({
      code: domainError.code ?? "INTERNAL_ERROR",
      message: error.message,
    }),
  };
}
```

- [ ] Commit

```bash
git add apps/api/src/shared/infrastructure/delivery/cors.ts apps/api/src/shared/infrastructure/delivery/HttpErrorMapper.ts
git commit -m "feat(api): add CORS headers and HTTP error mapper"
```

---

### Task 3: Zod validation schemas

**Files:**
- Create: `apps/api/src/shared/infrastructure/validation/schemas/user.schemas.ts`
- Create: `apps/api/src/shared/infrastructure/validation/schemas/memory.schemas.ts`

**Interfaces:**
- Produces: `createUserSchema`, `updateUserProfileSchema` (ZodObject)
- Produces: `createMemorySchema`, `updateMemorySchema`, `shareMemorySchema`, `addAttachmentSchema`, `searchMemoriesSchema` (ZodObject)

- [ ] **Create `user.schemas.ts`**

```typescript
import { z } from "zod";

export const createUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  username: z.string().regex(/^@?[a-z0-9_]{3,30}$/),
});

export const updateUserProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().optional(),
  description: z.string().max(500).optional(),
});
```

- [ ] **Create `memory.schemas.ts`**

```typescript
import { z } from "zod";

const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const createMemorySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(10000),
  memoryDate: z.string().datetime(),
  locationName: z.string().max(200).optional(),
  coordinates: coordinatesSchema.optional(),
  tags: z.array(z.string().regex(/^[a-z0-9_-]+$/).max(50)).optional(),
});

export const updateMemorySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(10000).optional(),
  memoryDate: z.string().datetime().optional(),
  locationName: z.string().max(200).nullable().optional(),
  coordinates: coordinatesSchema.nullable().optional(),
  tags: z.array(z.string().regex(/^[a-z0-9_-]+$/).max(50)).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

export const shareMemorySchema = z.object({
  targetUserId: z.string().uuid(),
});

export const addAttachmentSchema = z.object({
  s3Key: z.string().min(1),
  mimeType: z.string().min(1),
  description: z.string().max(500).optional(),
});

export const searchMemoriesSchema = z.object({
  text: z.string().optional(),
  tags: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
```

- [ ] Commit

```bash
git add apps/api/src/shared/infrastructure/validation/
git commit -m "feat(api): add Zod validation schemas for user and memory"
```

---

### Task 4: Cognito JWT verifier + withAuth middleware

**Files:**
- Create: `apps/api/src/shared/infrastructure/auth/CognitoJwtVerifier.ts`
- Create: `apps/api/src/shared/infrastructure/auth/withAuth.ts`

**Interfaces:**
- Produces: `getVerifier(): CognitoJwtVerifier` (from aws-jwt-verify)
- Produces: `withAuth(handler: (event: APIGatewayProxyEvent, ctx: AuthContext) => Promise<APIGatewayProxyResult>): (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>`
- Produces: `AuthContext = { userId: string; claims: { sub: string; username: string; email: string } }`

- [ ] **Create `CognitoJwtVerifier.ts`**

```typescript
import { CognitoJwtVerifier } from "aws-jwt-verify";

let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

export function getVerifier(): ReturnType<typeof CognitoJwtVerifier.create> {
  if (verifier) return verifier;

  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;

  if (!userPoolId || !clientId) {
    throw new Error("COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID must be set");
  }

  verifier = CognitoJwtVerifier.create({
    userPoolId,
    tokenUse: "id",
    clientId,
  });

  return verifier;
}
```

- [ ] **Create `withAuth.ts`**

```typescript
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getVerifier } from "./CognitoJwtVerifier.js";
import { corsHeaders } from "../delivery/cors.js";

export interface AuthContext {
  userId: string;
  claims: {
    sub: string;
    username: string;
    email: string;
  };
}

type AuthenticatedHandler = (
  event: APIGatewayProxyEvent,
  context: AuthContext,
) => Promise<APIGatewayProxyResult>;

function unauthorized(message: string): APIGatewayProxyResult {
  return {
    statusCode: 401,
    headers: corsHeaders,
    body: JSON.stringify({ code: "UNAUTHORIZED", message }),
  };
}

export function withAuth(handler: AuthenticatedHandler) {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const authHeader = event.headers["Authorization"] || event.headers["authorization"];

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return unauthorized("Missing or invalid Authorization header");
      }

      const token = authHeader.slice(7);
      const v = getVerifier();
      const payload = await v.verify(token);

      if (!payload.sub) {
        return unauthorized("Token missing sub claim");
      }

      const ctx: AuthContext = {
        userId: payload.sub,
        claims: {
          sub: payload.sub,
          username: (payload["cognito:username"] ?? payload.sub) as string,
          email: (payload.email ?? "") as string,
        },
      };

      return handler(event, ctx);
    } catch (err) {
      if (
        err instanceof Error &&
        (err.name === "JwtInvalidClaimError" ||
          err.name === "JwtExpiredError" ||
          err.name === "JwkInvalidError")
      ) {
        return unauthorized("Invalid or expired token");
      }

      console.error("Auth error:", err);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ code: "INTERNAL_ERROR", message: "Authentication error" }),
      };
    }
  };
}
```

- [ ] Commit

```bash
git add apps/api/src/shared/infrastructure/auth/
git commit -m "feat(api): add Cognito JWT verifier and withAuth middleware"
```

---

### Task 5: BaseLambdaHandler builder

**Files:**
- Create: `apps/api/src/shared/infrastructure/delivery/BaseLambdaHandler.ts`

**Interfaces:**
- Produces: `LambdaHandlerBuilder<T>` class with methods `validate(schema: ZodSchema<T>): this` and `handle(fn: ...)`
- Produces: `parseEvent(event: APIGatewayProxyEvent)` helper
- Produces: type `LambdaHandler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>`

- [ ] **Create `BaseLambdaHandler.ts`**

```typescript
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import type { ZodSchema, ZodError } from "zod";
import { corsHeaders } from "./cors.js";
import { mapErrorToHttpResponse } from "./HttpErrorMapper.js";

export type LambdaHandler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

export function parseEvent(event: APIGatewayProxyEvent): Record<string, unknown> {
  let body: unknown = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch {
      body = {};
    }
  }

  const queryParams: Record<string, string | undefined> = {};
  if (event.queryStringParameters) {
    for (const [key, value] of Object.entries(event.queryStringParameters)) {
      queryParams[key] = value;
    }
  }

  return {
    ...(typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {}),
    ...(event.pathParameters ?? {}),
    ...queryParams,
  };
}

function formatZodError(error: ZodError): APIGatewayProxyResult {
  return {
    statusCode: 400,
    headers: corsHeaders,
    body: JSON.stringify({
      code: "VALIDATION_ERROR",
      message: "Invalid request",
      details: error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    }),
  };
}

export class LambdaHandlerBuilder<T> {
  private schema: ZodSchema<T> | null = null;

  validate(schema: ZodSchema<T>): this {
    this.schema = schema;
    return this;
  }

  handle(
    fn: (event: APIGatewayProxyEvent, parsed: T) => Promise<APIGatewayProxyResult>,
  ): LambdaHandler {
    const schema = this.schema;

    return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
      try {
        if (schema) {
          const raw = parseEvent(event);
          const result = schema.safeParse(raw);
          if (!result.success) {
            return formatZodError(result.error);
          }
          return await fn(event, result.data);
        }
        return await fn(event, undefined as unknown as T);
      } catch (err) {
        if (err instanceof Error) {
          return mapErrorToHttpResponse(err);
        }
        console.error("Unknown error:", err);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ code: "INTERNAL_ERROR", message: "Unknown error" }),
        };
      }
    };
  }
}
```

- [ ] Commit

```bash
git add apps/api/src/shared/infrastructure/delivery/BaseLambdaHandler.ts
git commit -m "feat(api): add BaseLambdaHandler builder with Zod validation and error mapping"
```

---

### Task 6: DI container

**Files:**
- Create: `apps/api/src/shared/infrastructure/di/container.ts`

**Interfaces:**
- Produces: `container` (tsyringe container with all registrations)

- [ ] **Create `container.ts`**

```typescript
import "reflect-metadata";
import { container } from "tsyringe";
import { DITOKEN_ID_GENERATOR, DITOKEN_IEVENT_BUS } from "@acaixinha/shared";
import { DITOKEN_IUSER_REPOSITORY } from "../../../user/domain/repositories/IUserRepository.js";
import { DITOKEN_IMEMORY_REPOSITORY } from "../../../memory/domain/repositories/IMemoryRepository.js";
import { CryptoIdGenerator } from "../CryptoIdGenerator.js";
import { EventBridgeEventBus } from "../events/EventBridgeEventBus.js";
import { UserRepositoryImpl } from "../../../user/infrastructure/repositories/UserRepositoryImpl.js";
import { MemoryRepositoryImpl } from "../../../memory/infrastructure/repositories/MemoryRepositoryImpl.js";

container.register(DITOKEN_ID_GENERATOR, { useClass: CryptoIdGenerator });
container.register(DITOKEN_IEVENT_BUS, { useClass: EventBridgeEventBus });
container.register(DITOKEN_IUSER_REPOSITORY, { useClass: UserRepositoryImpl });
container.register(DITOKEN_IMEMORY_REPOSITORY, { useClass: MemoryRepositoryImpl });

export { container };
```

- [ ] Commit

```bash
git add apps/api/src/shared/infrastructure/di/
git commit -m "feat(api): add tsyringe DI container with all registrations"
```

---

### Task 7: EventBridge event bus + fix Memory domain errors

**Files:**
- Create: `apps/api/src/shared/infrastructure/events/EventBridgeEventBus.ts`
- Modify: `apps/api/src/memory/domain/models/Memory.ts`

**Interfaces:**
- Produces: `EventBridgeEventBus implements IEventBus`
- Consumes: `IEventBus` from `@acaixinha/shared`
- Fix: `Memory.addAttachment()` and `Memory.removeAttachment()` and `Memory.delete()` throw domain exceptions instead of `Error`

- [ ] **Create `EventBridgeEventBus.ts`**

```typescript
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { injectable } from "tsyringe";
import type { IEventBus, DomainEvent } from "@acaixinha/shared";

@injectable()
export class EventBridgeEventBus implements IEventBus {
  private readonly client = new EventBridgeClient({
    region: process.env.AWS_REGION ?? "eu-west-1",
  });
  private readonly eventBusName = process.env.EVENT_BUS_NAME ?? "default";

  async publish(event: DomainEvent): Promise<void> {
    try {
      await this.client.send(
        new PutEventsCommand({
          Entries: [
            {
              Source: "acaixinha.api",
              DetailType: event.constructor.name,
              Detail: JSON.stringify(event),
              EventBusName: this.eventBusName,
            },
          ],
        }),
      );
    } catch (err) {
      console.error("Failed to publish event to EventBridge:", err);
    }
  }
}
```

- [ ] **Fix `Memory.ts` — domain exceptions**

In `apps/api/src/memory/domain/models/Memory.ts`:

Replace lines 143-147 (`addAttachment` throw) from:
```typescript
    if (this.attachments.length >= MAX_ATTACHMENTS_PER_MEMORY) {
      throw new Error(
        `Memory has reached the maximum of ${MAX_ATTACHMENTS_PER_MEMORY} attachments`,
      );
    }
```
To:
```typescript
    if (this.attachments.length >= MAX_ATTACHMENTS_PER_MEMORY) {
      throw new AttachmentLimitExceededException(this.id.value);
    }
```

Add import at top:
```typescript
import { AttachmentLimitExceededException } from "../exceptions/AttachmentLimitExceededException.js";
```

Replace lines 159-168 (`removeAttachment` throw) from:
```typescript
    if (
      requestingUserId !== this.ownerId &&
      !this.attachments.some(
        (a) => a.id.equals(attachmentId) && a.uploadedByUserId === requestingUserId,
      )
    ) {
      throw new Error("Only the memory owner or the attachment uploader can remove it");
    }
```
To:
```typescript
    if (
      requestingUserId !== this.ownerId &&
      !this.attachments.some(
        (a) => a.id.equals(attachmentId) && a.uploadedByUserId === requestingUserId,
      )
    ) {
      throw new UnauthorizedMemoryAccessException(this.id.value, requestingUserId);
    }
```

Add import at top:
```typescript
import { UnauthorizedMemoryAccessException } from "../exceptions/UnauthorizedMemoryAccessException.js";
```

Replace lines 184-194 (`delete` throw) from:
```typescript
  delete(requestingUserId: string): void {
    if (!this.isOwner(requestingUserId)) {
      throw new Error("Only the memory owner can delete it");
    }
    this.record(
      new MemoryDeletedEvent({
        memoryId: this.id.value,
        ownerId: this.ownerId,
      }),
    );
  }
```
To:
```typescript
  delete(requestingUserId: string): void {
    if (!this.isOwner(requestingUserId)) {
      throw new UnauthorizedMemoryAccessException(this.id.value, requestingUserId);
    }
    this.record(
      new MemoryDeletedEvent({
        memoryId: this.id.value,
        ownerId: this.ownerId,
      }),
    );
  }
```

- [ ] Commit

```bash
git add apps/api/src/shared/infrastructure/events/ apps/api/src/memory/domain/models/Memory.ts
git commit -m "feat(api): add EventBridge event bus and fix Memory domain errors to use typed exceptions"
```

---

### Task 8: Missing use case wrappers

**Files:**
- Create: `apps/api/src/memory/application/use-cases/GetMemoryUseCase.ts`
- Create: `apps/api/src/memory/application/use-cases/GetUserMemoriesUseCase.ts`
- Create: `apps/api/src/memory/application/use-cases/UnshareMemoryUseCase.ts`

**Interfaces:**
- Produces: `GetMemoryUseCase.execute(memoryId: string, requestingUserId: string): Promise<MemoryResponseDTO>`
- Produces: `GetUserMemoriesUseCase.execute(userId: string): Promise<MemoryResponseDTO[]>`
- Produces: `UnshareMemoryUseCase.execute(memoryId: string, requestingUserId: string, targetUserId: string): Promise<MemoryResponseDTO>`

- [ ] **Create `GetMemoryUseCase.ts`**

```typescript
import { injectable, inject } from "tsyringe";
import { GetMemoryByIdQuery } from "../queries/GetMemoryByIdQuery.js";
import { GetMemoryByIdQueryHandler } from "../queries/GetMemoryByIdQueryHandler.js";
import type { MemoryResponseDTO } from "../dto/MemoryResponseDTO.js";

@injectable()
export class GetMemoryUseCase {
  constructor(
    @inject(GetMemoryByIdQueryHandler) private readonly handler: GetMemoryByIdQueryHandler,
  ) {}

  async execute(memoryId: string, requestingUserId: string): Promise<MemoryResponseDTO> {
    const query = new GetMemoryByIdQuery(memoryId, requestingUserId);
    return this.handler.execute(query);
  }
}
```

- [ ] **Create `GetUserMemoriesUseCase.ts`**

```typescript
import { injectable, inject } from "tsyringe";
import { GetUserMemoriesQuery } from "../queries/GetUserMemoriesQuery.js";
import { GetUserMemoriesQueryHandler } from "../queries/GetUserMemoriesQueryHandler.js";
import type { MemoryResponseDTO } from "../dto/MemoryResponseDTO.js";

@injectable()
export class GetUserMemoriesUseCase {
  constructor(
    @inject(GetUserMemoriesQueryHandler) private readonly handler: GetUserMemoriesQueryHandler,
  ) {}

  async execute(userId: string): Promise<MemoryResponseDTO[]> {
    const query = new GetUserMemoriesQuery(userId);
    return this.handler.execute(query);
  }
}
```

- [ ] **Create `UnshareMemoryUseCase.ts`**

```typescript
import { injectable, inject } from "tsyringe";
import { UnshareMemoryCommand } from "../commands/UnshareMemoryCommand.js";
import { UnshareMemoryCommandHandler } from "../commands/UnshareMemoryCommandHandler.js";
import { MemoryResponseDTO } from "../dto/MemoryResponseDTO.js";
import { MemoryMapper } from "../mappers/MemoryMapper.js";

@injectable()
export class UnshareMemoryUseCase {
  constructor(
    @inject(UnshareMemoryCommandHandler) private readonly handler: UnshareMemoryCommandHandler,
  ) {}

  async execute(
    memoryId: string,
    requestingUserId: string,
    targetUserId: string,
  ): Promise<MemoryResponseDTO> {
    const command = new UnshareMemoryCommand(memoryId, requestingUserId, targetUserId);
    const memory = await this.handler.execute(command);
    return MemoryMapper.toResponse(memory);
  }
}
```

- [ ] Commit

```bash
git add apps/api/src/memory/application/use-cases/GetMemoryUseCase.ts apps/api/src/memory/application/use-cases/GetUserMemoriesUseCase.ts apps/api/src/memory/application/use-cases/UnshareMemoryUseCase.ts
git commit -m "feat(api): add missing use case wrappers for GetMemory, GetUserMemories, UnshareMemory"
```

---

### Task 9: User HTTP handlers

**Files:**
- Create: `apps/api/src/user/infrastructure/delivery/CreateUserHandler.ts`
- Create: `apps/api/src/user/infrastructure/delivery/GetUserHandler.ts`
- Create: `apps/api/src/user/infrastructure/delivery/UpdateUserProfileHandler.ts`
- Create: `apps/api/src/user/infrastructure/delivery/DeleteUserHandler.ts`

**Interfaces:**
- Produces: each class has `handle(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>`
- Consumes: `CreateUserUseCase`, `GetUserByIdUseCase`, `UpdateUserProfileUseCase`, `DeleteUserUseCase`
- Consumes: `LambdaHandlerBuilder`, `AuthContext` from shared infrastructure

- [ ] **Create `CreateUserHandler.ts`**

```typescript
import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { CreateUserUseCase } from "../../../user/application/use-cases/CreateUserUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { createUserSchema } from "../../../shared/infrastructure/validation/schemas/user.schemas.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";

@injectable()
export class CreateUserHandler {
  constructor(@inject(CreateUserUseCase) private readonly useCase: CreateUserUseCase) {}

  handle(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return new LambdaHandlerBuilder()
      .validate(createUserSchema)
      .handle(async (_event, parsed) => {
        const result = await this.useCase.execute(parsed.id, parsed.name, parsed.username);
        return {
          statusCode: 201,
          headers: corsHeaders,
          body: JSON.stringify(result),
        };
      });
  }
}
```

- [ ] **Create `GetUserHandler.ts`**

```typescript
import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetUserByIdUseCase } from "../../../user/application/use-cases/GetUserByIdUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

interface GetUserParams {
  userId: string;
}

@injectable()
export class GetUserHandler {
  constructor(@inject(GetUserByIdUseCase) private readonly useCase: GetUserByIdUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    const { userId } = (event.pathParameters ?? {}) as unknown as GetUserParams;
    return new LambdaHandlerBuilder()
      .handle(async () => {
        const result = await this.useCase.execute(userId);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(result),
        };
      });
  }
}
```

- [ ] **Create `UpdateUserProfileHandler.ts`**

```typescript
import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { UpdateUserProfileUseCase } from "../../../user/application/use-cases/UpdateUserProfileUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { updateUserProfileSchema } from "../../../shared/infrastructure/validation/schemas/user.schemas.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

interface UpdateUserProfileParams {
  userId: string;
}

@injectable()
export class UpdateUserProfileHandler {
  constructor(@inject(UpdateUserProfileUseCase) private readonly useCase: UpdateUserProfileUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    return new LambdaHandlerBuilder()
      .validate(updateUserProfileSchema)
      .handle(async (_event, parsed) => {
        const result = await this.useCase.execute(
          ctx.userId,
          parsed.name,
          parsed.avatarUrl,
          parsed.description,
        );
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(result),
        };
      });
  }
}
```

- [ ] **Create `DeleteUserHandler.ts`**

```typescript
import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DeleteUserUseCase } from "../../../user/application/use-cases/DeleteUserUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class DeleteUserHandler {
  constructor(@inject(DeleteUserUseCase) private readonly useCase: DeleteUserUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    return new LambdaHandlerBuilder()
      .handle(async () => {
        await this.useCase.execute(ctx.userId);
        return {
          statusCode: 204,
          headers: corsHeaders,
          body: "",
        };
      });
  }
}
```

- [ ] Commit

```bash
git add apps/api/src/user/infrastructure/delivery/
git commit -m "feat(api): add User HTTP handlers (create, get, update, delete)"
```

---

### Task 10: User Lambda entry points

**Files:**
- Create: `apps/api/src/user/infrastructure/lambdas/createUser.ts`
- Create: `apps/api/src/user/infrastructure/lambdas/getUser.ts`
- Create: `apps/api/src/user/infrastructure/lambdas/updateUserProfile.ts`
- Create: `apps/api/src/user/infrastructure/lambdas/deleteUser.ts`

**Interfaces:**
- Produces: each exports `export const handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>`
- Consumes: `container`, `withAuth`, user handlers

- [ ] **Create `createUser.ts`**

```typescript
import { container } from "../../../shared/infrastructure/di/container.js";
import { CreateUserHandler } from "../delivery/CreateUserHandler.js";

const handler = container.resolve(CreateUserHandler);
export { handler };
```

Note: `CreateUserHandler.handle` is NOT wrapped with `withAuth` since this endpoint is unauthenticated.

- [ ] **Create `getUser.ts`**

```typescript
import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { GetUserHandler } from "../delivery/GetUserHandler.js";

const getUserHandler = container.resolve(GetUserHandler);
export const handler = withAuth(getUserHandler.handle.bind(getUserHandler));
```

- [ ] **Create `updateUserProfile.ts`**

```typescript
import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { UpdateUserProfileHandler } from "../delivery/UpdateUserProfileHandler.js";

const updateUserProfileHandler = container.resolve(UpdateUserProfileHandler);
export const handler = withAuth(updateUserProfileHandler.handle.bind(updateUserProfileHandler));
```

- [ ] **Create `deleteUser.ts`**

```typescript
import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { DeleteUserHandler } from "../delivery/DeleteUserHandler.js";

const deleteUserHandler = container.resolve(DeleteUserHandler);
export const handler = withAuth(deleteUserHandler.handle.bind(deleteUserHandler));
```

- [ ] Commit

```bash
git add apps/api/src/user/infrastructure/lambdas/
git commit -m "feat(api): add User Lambda entry points"
```

---

### Task 11: Memory HTTP handlers

**Files:**
- Create: `apps/api/src/memory/infrastructure/delivery/CreateMemoryHandler.ts`
- Create: `apps/api/src/memory/infrastructure/delivery/GetMemoryHandler.ts`
- Create: `apps/api/src/memory/infrastructure/delivery/UpdateMemoryHandler.ts`
- Create: `apps/api/src/memory/infrastructure/delivery/DeleteMemoryHandler.ts`
- Create: `apps/api/src/memory/infrastructure/delivery/ListMemoriesHandler.ts`
- Create: `apps/api/src/memory/infrastructure/delivery/SearchMemoriesHandler.ts`
- Create: `apps/api/src/memory/infrastructure/delivery/ShareMemoryHandler.ts`
- Create: `apps/api/src/memory/infrastructure/delivery/UnshareMemoryHandler.ts`
- Create: `apps/api/src/memory/infrastructure/delivery/AddAttachmentHandler.ts`
- Create: `apps/api/src/memory/infrastructure/delivery/RemoveAttachmentHandler.ts`

**Interfaces:**
- Produces: each class has `handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult>`
- Consumes: memory use cases, `LambdaHandlerBuilder`, schemas, `corsHeaders`

- [ ] **Create `CreateMemoryHandler.ts`**

```typescript
import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { CreateMemoryUseCase } from "../../../memory/application/use-cases/CreateMemoryUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { createMemorySchema } from "../../../shared/infrastructure/validation/schemas/memory.schemas.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class CreateMemoryHandler {
  constructor(@inject(CreateMemoryUseCase) private readonly useCase: CreateMemoryUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    return new LambdaHandlerBuilder()
      .validate(createMemorySchema)
      .handle(async (_event, parsed) => {
        const result = await this.useCase.execute(
          ctx.userId,
          parsed.title,
          parsed.description,
          parsed.memoryDate,
          parsed.locationName,
          parsed.coordinates
            ? { latitude: parsed.coordinates.lat, longitude: parsed.coordinates.lng }
            : undefined,
          parsed.tags,
        );
        return { statusCode: 201, headers: corsHeaders, body: JSON.stringify(result) };
      });
  }
}
```

- [ ] **Create `GetMemoryHandler.ts`**

```typescript
import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetMemoryUseCase } from "../../../memory/application/use-cases/GetMemoryUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class GetMemoryHandler {
  constructor(@inject(GetMemoryUseCase) private readonly useCase: GetMemoryUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    const memoryId = event.pathParameters?.memoryId ?? "";
    return new LambdaHandlerBuilder()
      .handle(async () => {
        const result = await this.useCase.execute(memoryId, ctx.userId);
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(result) };
      });
  }
}
```

- [ ] **Create `UpdateMemoryHandler.ts`**

```typescript
import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { UpdateMemoryUseCase } from "../../../memory/application/use-cases/UpdateMemoryUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { updateMemorySchema } from "../../../shared/infrastructure/validation/schemas/memory.schemas.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class UpdateMemoryHandler {
  constructor(@inject(UpdateMemoryUseCase) private readonly useCase: UpdateMemoryUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    const memoryId = event.pathParameters?.memoryId ?? "";
    return new LambdaHandlerBuilder()
      .validate(updateMemorySchema)
      .handle(async (_event, parsed) => {
        const result = await this.useCase.execute(
          memoryId,
          ctx.userId,
          parsed.title,
          parsed.description,
          parsed.memoryDate,
          parsed.locationName ?? undefined,
          parsed.coordinates
            ? { latitude: parsed.coordinates.lat, longitude: parsed.coordinates.lng }
            : (parsed.coordinates === null ? undefined : undefined),
          parsed.tags,
        );
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(result) };
      });
  }
}
```

- [ ] **Create `DeleteMemoryHandler.ts`**

```typescript
import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DeleteMemoryUseCase } from "../../../memory/application/use-cases/DeleteMemoryUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class DeleteMemoryHandler {
  constructor(@inject(DeleteMemoryUseCase) private readonly useCase: DeleteMemoryUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    const memoryId = event.pathParameters?.memoryId ?? "";
    return new LambdaHandlerBuilder()
      .handle(async () => {
        await this.useCase.execute(memoryId, ctx.userId);
        return { statusCode: 204, headers: corsHeaders, body: "" };
      });
  }
}
```

- [ ] **Create `ListMemoriesHandler.ts`**

```typescript
import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetUserMemoriesUseCase } from "../../../memory/application/use-cases/GetUserMemoriesUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class ListMemoriesHandler {
  constructor(@inject(GetUserMemoriesUseCase) private readonly useCase: GetUserMemoriesUseCase) {}

  handle(_event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    return new LambdaHandlerBuilder()
      .handle(async () => {
        const result = await this.useCase.execute(ctx.userId);
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(result) };
      });
  }
}
```

- [ ] **Create `SearchMemoriesHandler.ts`**

```typescript
import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { SearchMemoriesUseCase } from "../../../memory/application/use-cases/SearchMemoriesUseCase.js";
import type { SearchMemoriesDTO } from "../../../memory/application/dto/SearchMemoriesDTO.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { searchMemoriesSchema } from "../../../shared/infrastructure/validation/schemas/memory.schemas.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class SearchMemoriesHandler {
  constructor(@inject(SearchMemoriesUseCase) private readonly useCase: SearchMemoriesUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    return new LambdaHandlerBuilder()
      .validate(searchMemoriesSchema)
      .handle(async (_event, parsed) => {
        const filters: SearchMemoriesDTO = {
          text: parsed.text,
          tags: parsed.tags ? parsed.tags.split(",") : undefined,
          dateFrom: parsed.dateFrom,
          dateTo: parsed.dateTo,
          page: parsed.page ? parseInt(parsed.page, 10) : undefined,
          limit: parsed.limit ? parseInt(parsed.limit, 10) : undefined,
        };
        const result = await this.useCase.execute(ctx.userId, filters);
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(result) };
      });
  }
}
```

- [ ] **Create `ShareMemoryHandler.ts`**

```typescript
import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ShareMemoryUseCase } from "../../../memory/application/use-cases/ShareMemoryUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { shareMemorySchema } from "../../../shared/infrastructure/validation/schemas/memory.schemas.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class ShareMemoryHandler {
  constructor(@inject(ShareMemoryUseCase) private readonly useCase: ShareMemoryUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    const memoryId = event.pathParameters?.memoryId ?? "";
    return new LambdaHandlerBuilder()
      .validate(shareMemorySchema)
      .handle(async (_event, parsed) => {
        const result = await this.useCase.execute(memoryId, ctx.userId, parsed.targetUserId);
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(result) };
      });
  }
}
```

- [ ] **Create `UnshareMemoryHandler.ts`**

```typescript
import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { UnshareMemoryUseCase } from "../../../memory/application/use-cases/UnshareMemoryUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class UnshareMemoryHandler {
  constructor(@inject(UnshareMemoryUseCase) private readonly useCase: UnshareMemoryUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    const memoryId = event.pathParameters?.memoryId ?? "";
    const targetUserId = event.pathParameters?.userId ?? "";
    return new LambdaHandlerBuilder()
      .handle(async () => {
        const result = await this.useCase.execute(memoryId, ctx.userId, targetUserId);
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(result) };
      });
  }
}
```

- [ ] **Create `AddAttachmentHandler.ts`**

```typescript
import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { AddAttachmentUseCase } from "../../../memory/application/use-cases/AddAttachmentUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { addAttachmentSchema } from "../../../shared/infrastructure/validation/schemas/memory.schemas.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class AddAttachmentHandler {
  constructor(@inject(AddAttachmentUseCase) private readonly useCase: AddAttachmentUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    const memoryId = event.pathParameters?.memoryId ?? "";
    return new LambdaHandlerBuilder()
      .validate(addAttachmentSchema)
      .handle(async (_event, parsed) => {
        const result = await this.useCase.execute(
          memoryId,
          ctx.userId,
          parsed.s3Key,
          parsed.mimeType,
          parsed.description,
        );
        return { statusCode: 201, headers: corsHeaders, body: JSON.stringify(result) };
      });
  }
}
```

- [ ] **Create `RemoveAttachmentHandler.ts`**

```typescript
import { injectable, inject } from "tsyringe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { RemoveAttachmentUseCase } from "../../../memory/application/use-cases/RemoveAttachmentUseCase.js";
import { LambdaHandlerBuilder } from "../../../shared/infrastructure/delivery/BaseLambdaHandler.js";
import { corsHeaders } from "../../../shared/infrastructure/delivery/cors.js";
import type { AuthContext } from "../../../shared/infrastructure/auth/withAuth.js";

@injectable()
export class RemoveAttachmentHandler {
  constructor(@inject(RemoveAttachmentUseCase) private readonly useCase: RemoveAttachmentUseCase) {}

  handle(event: APIGatewayProxyEvent, ctx: AuthContext): Promise<APIGatewayProxyResult> {
    const memoryId = event.pathParameters?.memoryId ?? "";
    const attachmentId = event.pathParameters?.attachmentId ?? "";
    return new LambdaHandlerBuilder()
      .handle(async () => {
        const result = await this.useCase.execute(memoryId, attachmentId, ctx.userId);
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(result) };
      });
  }
}
```

- [ ] Commit

```bash
git add apps/api/src/memory/infrastructure/delivery/
git commit -m "feat(api): add Memory HTTP handlers (create, get, update, delete, list, search, share, unshare, attachments)"
```

---

### Task 12: Memory Lambda entry points

**Files:**
- Create: `apps/api/src/memory/infrastructure/lambdas/createMemory.ts`
- Create: `apps/api/src/memory/infrastructure/lambdas/getMemory.ts`
- Create: `apps/api/src/memory/infrastructure/lambdas/updateMemory.ts`
- Create: `apps/api/src/memory/infrastructure/lambdas/deleteMemory.ts`
- Create: `apps/api/src/memory/infrastructure/lambdas/listMemories.ts`
- Create: `apps/api/src/memory/infrastructure/lambdas/searchMemories.ts`
- Create: `apps/api/src/memory/infrastructure/lambdas/shareMemory.ts`
- Create: `apps/api/src/memory/infrastructure/lambdas/unshareMemory.ts`
- Create: `apps/api/src/memory/infrastructure/lambdas/addAttachment.ts`
- Create: `apps/api/src/memory/infrastructure/lambdas/removeAttachment.ts`

- [ ] **Create all 10 Lambda entry points** — each follows the same pattern as Task 10 but for memory handlers. All use `withAuth`.

**`createMemory.ts`:**
```typescript
import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { CreateMemoryHandler } from "../delivery/CreateMemoryHandler.js";

const createMemoryHandler = container.resolve(CreateMemoryHandler);
export const handler = withAuth(createMemoryHandler.handle.bind(createMemoryHandler));
```

**`getMemory.ts`:**
```typescript
import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { GetMemoryHandler } from "../delivery/GetMemoryHandler.js";

const getMemoryHandler = container.resolve(GetMemoryHandler);
export const handler = withAuth(getMemoryHandler.handle.bind(getMemoryHandler));
```

**`updateMemory.ts`:**
```typescript
import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { UpdateMemoryHandler } from "../delivery/UpdateMemoryHandler.js";

const updateMemoryHandler = container.resolve(UpdateMemoryHandler);
export const handler = withAuth(updateMemoryHandler.handle.bind(updateMemoryHandler));
```

**`deleteMemory.ts`:**
```typescript
import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { DeleteMemoryHandler } from "../delivery/DeleteMemoryHandler.js";

const deleteMemoryHandler = container.resolve(DeleteMemoryHandler);
export const handler = withAuth(deleteMemoryHandler.handle.bind(deleteMemoryHandler));
```

**`listMemories.ts`:**
```typescript
import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { ListMemoriesHandler } from "../delivery/ListMemoriesHandler.js";

const listMemoriesHandler = container.resolve(ListMemoriesHandler);
export const handler = withAuth(listMemoriesHandler.handle.bind(listMemoriesHandler));
```

**`searchMemories.ts`:**
```typescript
import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { SearchMemoriesHandler } from "../delivery/SearchMemoriesHandler.js";

const searchMemoriesHandler = container.resolve(SearchMemoriesHandler);
export const handler = withAuth(searchMemoriesHandler.handle.bind(searchMemoriesHandler));
```

**`shareMemory.ts`:**
```typescript
import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { ShareMemoryHandler } from "../delivery/ShareMemoryHandler.js";

const shareMemoryHandler = container.resolve(ShareMemoryHandler);
export const handler = withAuth(shareMemoryHandler.handle.bind(shareMemoryHandler));
```

**`unshareMemory.ts`:**
```typescript
import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { UnshareMemoryHandler } from "../delivery/UnshareMemoryHandler.js";

const unshareMemoryHandler = container.resolve(UnshareMemoryHandler);
export const handler = withAuth(unshareMemoryHandler.handle.bind(unshareMemoryHandler));
```

**`addAttachment.ts`:**
```typescript
import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { AddAttachmentHandler } from "../delivery/AddAttachmentHandler.js";

const addAttachmentHandler = container.resolve(AddAttachmentHandler);
export const handler = withAuth(addAttachmentHandler.handle.bind(addAttachmentHandler));
```

**`removeAttachment.ts`:**
```typescript
import { container } from "../../../shared/infrastructure/di/container.js";
import { withAuth } from "../../../shared/infrastructure/auth/withAuth.js";
import { RemoveAttachmentHandler } from "../delivery/RemoveAttachmentHandler.js";

const removeAttachmentHandler = container.resolve(RemoveAttachmentHandler);
export const handler = withAuth(removeAttachmentHandler.handle.bind(removeAttachmentHandler));
```

- [ ] Commit

```bash
git add apps/api/src/memory/infrastructure/lambdas/
git commit -m "feat(api): add Memory Lambda entry points"
```

---

### Task 13: Cognito Post-Confirmation trigger

**Files:**
- Create: `apps/api/src/auth/infrastructure/lambdas/postConfirmation.ts`

**Interfaces:**
- Produces: `handler(event: PostConfirmationTriggerEvent): Promise<PostConfirmationTriggerEvent>`
- Consumes: `CreateUserUseCase`, `container`

- [ ] **Create `postConfirmation.ts`**

```typescript
import type { PostConfirmationTriggerEvent } from "aws-lambda";
import { container } from "../../../shared/infrastructure/di/container.js";
import { CreateUserUseCase } from "../../../user/application/use-cases/CreateUserUseCase.js";

export async function handler(event: PostConfirmationTriggerEvent): Promise<PostConfirmationTriggerEvent> {
  const useCase = container.resolve(CreateUserUseCase);

  try {
    const sub = event.request.userAttributes.sub;
    const email = event.request.userAttributes.email ?? event.userName;
    const name = event.request.userAttributes.name ?? event.userName;

    await useCase.execute(sub, name, email);
  } catch (err) {
    if (
      err instanceof Error &&
      (err as { code?: string }).code === "USER_ALREADY_EXISTS"
    ) {
      // User already exists — idempotent, do nothing
      console.log("User already exists, skipping creation");
    } else {
      console.error("Failed to create user in post-confirmation trigger:", err);
    }
  }

  return event;
}
```

- [ ] Commit

```bash
git add apps/api/src/auth/infrastructure/lambdas/postConfirmation.ts
git commit -m "feat(api): add Cognito Post-Confirmation trigger Lambda"
```

---

### Task 14: Update localServer for dev mode

**Files:**
- Modify: `apps/api/src/server/localServer.ts`

**Interfaces:**
- Produces: `localServer.ts` registers all Lambda handlers as Express routes for local development

- [ ] **Update `localServer.ts`**

```typescript
import express from "express";
import "reflect-metadata";
import { container } from "../shared/infrastructure/di/container.js";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

// User handlers
import { CreateUserHandler } from "../user/infrastructure/delivery/CreateUserHandler.js";
import { GetUserHandler } from "../user/infrastructure/delivery/GetUserHandler.js";
import { UpdateUserProfileHandler } from "../user/infrastructure/delivery/UpdateUserProfileHandler.js";
import { DeleteUserHandler } from "../user/infrastructure/delivery/DeleteUserHandler.js";

// Memory handlers
import { CreateMemoryHandler } from "../memory/infrastructure/delivery/CreateMemoryHandler.js";
import { GetMemoryHandler } from "../memory/infrastructure/delivery/GetMemoryHandler.js";
import { UpdateMemoryHandler } from "../memory/infrastructure/delivery/UpdateMemoryHandler.js";
import { DeleteMemoryHandler } from "../memory/infrastructure/delivery/DeleteMemoryHandler.js";
import { ListMemoriesHandler } from "../memory/infrastructure/delivery/ListMemoriesHandler.js";
import { SearchMemoriesHandler } from "../memory/infrastructure/delivery/SearchMemoriesHandler.js";
import { ShareMemoryHandler } from "../memory/infrastructure/delivery/ShareMemoryHandler.js";
import { UnshareMemoryHandler } from "../memory/infrastructure/delivery/UnshareMemoryHandler.js";
import { AddAttachmentHandler } from "../memory/infrastructure/delivery/AddAttachmentHandler.js";
import { RemoveAttachmentHandler } from "../memory/infrastructure/delivery/RemoveAttachmentHandler.js";

// Auth middleware
import { withAuth } from "../shared/infrastructure/auth/withAuth.js";
import type { AuthContext } from "../shared/infrastructure/auth/withAuth.js";

type LambdaHandler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

function toLambdaEvent(req: express.Request): APIGatewayProxyEvent {
  return {
    httpMethod: req.method,
    path: req.path,
    headers: Object.entries(req.headers).reduce(
      (acc, [k, v]) => ({ ...acc, [k]: String(v ?? "") }),
      {} as Record<string, string>,
    ),
    queryStringParameters:
      Object.keys(req.query).length > 0
        ? Object.entries(req.query).reduce<Record<string, string | undefined>>(
            (acc, [k, v]) => ({ ...acc, [k]: typeof v === "string" ? v : undefined }),
            {} as Record<string, string | undefined>,
          )
        : null,
    pathParameters: req.params && Object.keys(req.params).length > 0
      ? Object.entries(req.params).reduce(
          (acc, [k, v]) => ({ ...acc, [k]: String(v) }),
          {} as Record<string, string>,
        )
      : null,
    body: req.body ? JSON.stringify(req.body) : null,
    isBase64Encoded: false,
    resource: req.route?.path ?? req.path,
    requestContext: {} as APIGatewayProxyEvent["requestContext"],
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
  };
}

function wrapHandler(handler: LambdaHandler): express.RequestHandler {
  return async (req, res) => {
    try {
      const event = toLambdaEvent(req);
      const result = await handler(event);
      res.status(result.statusCode).set(result.headers);
      if (result.body) {
        res.json(JSON.parse(result.body));
      } else {
        res.end();
      }
    } catch (err) {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

// Dev auth middleware: injects a fake user ID from Authorization header
// In production, Cognito handles this. For local dev, pass userId as Bearer token.
function devAuth(handler: (req: express.Request, res: express.Response, ctx: AuthContext) => void): express.RequestHandler {
  return (req, res) => {
    const authHeader = req.headers.authorization;
    let userId = "dev-user";
    if (authHeader?.startsWith("Bearer ")) {
      userId = authHeader.slice(7);
    }
    const ctx: AuthContext = {
      userId,
      claims: { sub: userId, username: userId, email: `${userId}@example.com` },
    };
    handler(req, res, ctx);
  };
}

export function registerRoutes(app: express.Application): void {
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  const createUserHandler = container.resolve(CreateUserHandler);
  app.post("/users", wrapHandler(createUserHandler.handle.bind(createUserHandler)));

  const getUserHandler = container.resolve(GetUserHandler);
  app.get("/users/:userId", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    getUserHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const updateUserProfileHandler = container.resolve(UpdateUserProfileHandler);
  app.patch("/users/:userId", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    updateUserProfileHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const deleteUserHandler = container.resolve(DeleteUserHandler);
  app.delete("/users/:userId", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    deleteUserHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  // Memory routes
  const createMemoryHandler = container.resolve(CreateMemoryHandler);
  app.post("/memories", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    createMemoryHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const getMemoryHandler = container.resolve(GetMemoryHandler);
  app.get("/memories/:memoryId", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    getMemoryHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const updateMemoryHandler = container.resolve(UpdateMemoryHandler);
  app.patch("/memories/:memoryId", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    updateMemoryHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const deleteMemoryHandler = container.resolve(DeleteMemoryHandler);
  app.delete("/memories/:memoryId", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    deleteMemoryHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const listMemoriesHandler = container.resolve(ListMemoriesHandler);
  app.get("/memories", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    listMemoriesHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const searchMemoriesHandler = container.resolve(SearchMemoriesHandler);
  app.get("/memories/search", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    searchMemoriesHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const shareMemoryHandler = container.resolve(ShareMemoryHandler);
  app.post("/memories/:memoryId/share", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    shareMemoryHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const unshareMemoryHandler = container.resolve(UnshareMemoryHandler);
  app.delete("/memories/:memoryId/share/:userId", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    unshareMemoryHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const addAttachmentHandler = container.resolve(AddAttachmentHandler);
  app.post("/memories/:memoryId/attachments", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    addAttachmentHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const removeAttachmentHandler = container.resolve(RemoveAttachmentHandler);
  app.delete("/memories/:memoryId/attachments/:attachmentId", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    removeAttachmentHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));
}

function main(): void {
  const app = express();
  app.use(express.json());

  registerRoutes(app);

  const port = process.env.PORT ?? 3000;
  app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
    console.log("Dev auth: pass user ID as Authorization: Bearer <userId>");
  });
}

main();
```

- [ ] Commit

```bash
git add apps/api/src/server/localServer.ts
git commit -m "feat(api): wire Lambda handlers to Express for local development"
```

---

### Task 15: Build verification

- [ ] **Run typecheck**

```bash
pnpm run typecheck --filter @acaixinha/api
```

Expected: no TypeScript errors.

- [ ] **Fix any type errors** if they appear. Common issues:
  - Missing `.js` extensions on imports
  - `aws-lambda` type mismatch (use `import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"`)
  - tsyringe decorator metadata might need `reflect-metadata` import order

- [ ] **Run full build**

```bash
pnpm run build --filter @acaixinha/api
```

Expected: compiles successfully.

- [ ] Commit any fixes

```bash
git add -A && git commit -m "fix(api): resolve typecheck and build issues"
```