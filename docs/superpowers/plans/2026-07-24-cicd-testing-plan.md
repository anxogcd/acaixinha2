# CI + Domain Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement task-by-task.

**Goal:** Vitest unit tests for User and Memory domain layers + GitHub Actions CI workflow (lint, typecheck, test, build).

**Architecture:** Vitest configured for `apps/api` with Node environment. Tests follow AAA pattern. Each test file covers one domain concept (VO, aggregate, service). GitHub Actions triggers on PR to main.

**Tech Stack:** Vitest, @vitest/coverage-v8, GitHub Actions

## Global Constraints

- Tests verify real behavior, not mock behavior
- AAA pattern (Arrange, Act, Assert)
- Coverage targets: 80% statements in domain layer
- CI runs on every PR: lint, typecheck, test, build
- Domain has zero external dependencies — no mocks needed for unit tests

---

### Task 1: Vitest config + scripts for API

**Files:**
- Modify: `apps/api/package.json`
- Create: `apps/api/vitest.config.ts`

- [ ] **Step 1: Update apps/api/package.json with vitest dependencies and scripts**

```json
{
  "scripts": {
    "dev": "tsx watch src/server/localServer.ts",
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

Run to add deps:
```bash
pnpm add --filter @acaixinha/api -D vitest @vitest/coverage-v8
```

- [ ] **Step 2: Create vitest.config.ts**

```typescript
// apps/api/vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/domain/**/*.ts"],
      exclude: ["src/**/index.ts", "src/**/__tests__/**"],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@acaixinha/shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
});
```

- [ ] **Step 3: Verify vitest runs**

```bash
pnpm --filter @acaixinha/api test
```
Expected: "No test files found" or similar (no tests yet).

- [ ] **Step 4: Commit**

```bash
git add apps/api/package.json apps/api/vitest.config.ts pnpm-lock.yaml
git commit -m "feat(api): add Vitest config with coverage for domain layer"
```

---

### Task 2: User domain tests — Value Objects

**Files:**
- Create: `apps/api/src/user/domain/__tests__/value-objects.test.ts`

- [ ] **Step 1: Create User VO tests**

```typescript
// apps/api/src/user/domain/__tests__/value-objects.test.ts
import { describe, it, expect } from "vitest";
import { UserId } from "../value-objects/UserId";
import { UserName } from "../value-objects/UserName";
import { UserUsername } from "../value-objects/UserUsername";
import { UserDescription } from "../value-objects/UserDescription";
import { UserAvatarUrl } from "../value-objects/UserAvatarUrl";

describe("UserId", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";

  it("creates with valid UUID", () => {
    const id = new UserId(validUuid);
    expect(id.value).toBe(validUuid);
  });

  it("throws on empty string", () => {
    expect(() => new UserId("")).toThrow();
  });

  it("throws on invalid UUID", () => {
    expect(() => new UserId("not-a-uuid")).toThrow();
  });

  it("equals works with same value", () => {
    const a = new UserId(validUuid);
    const b = new UserId(validUuid);
    expect(a.equals(b)).toBe(true);
  });

  it("equals returns false for different value", () => {
    const a = new UserId(validUuid);
    const b = new UserId("660e8400-e29b-41d4-a716-446655440001");
    expect(a.equals(b)).toBe(false);
  });
});

describe("UserName", () => {
  it("creates with valid name", () => {
    const name = new UserName("Anxo");
    expect(name.value).toBe("Anxo");
  });

  it("throws on empty string", () => {
    expect(() => new UserName("")).toThrow();
  });

  it("throws on string exceeding 100 characters", () => {
    const long = "a".repeat(101);
    expect(() => new UserName(long)).toThrow();
  });

  it("allows 100 characters", () => {
    const max = "a".repeat(100);
    const name = new UserName(max);
    expect(name.value).toBe(max);
  });
});

describe("UserUsername", () => {
  it("creates with valid username", () => {
    const username = new UserUsername("anxo_gcd");
    expect(username.value).toBe("anxo_gcd");
  });

  it("creates with @ prefix", () => {
    const username = new UserUsername("@anxo");
    expect(username.value).toBe("@anxo");
  });

  it("throws on empty string", () => {
    expect(() => new UserUsername("")).toThrow();
  });

  it("throws on username shorter than 3 chars", () => {
    expect(() => new UserUsername("ab")).toThrow();
  });

  it("throws on username exceeding 30 chars", () => {
    expect(() => new UserUsername("a".repeat(31))).toThrow();
  });

  it("throws on username with uppercase", () => {
    expect(() => new UserUsername("AnxoGCD")).toThrow();
  });

  it("throws on username with spaces", () => {
    expect(() => new UserUsername("anxo gcd")).toThrow();
  });
});

describe("UserDescription", () => {
  it("creates with valid description", () => {
    const desc = new UserDescription("Hello world");
    expect(desc.value).toBe("Hello world");
  });

  it("allows empty string", () => {
    const desc = new UserDescription("");
    expect(desc.value).toBe("");
  });

  it("throws on string exceeding 500 characters", () => {
    const long = "a".repeat(501);
    expect(() => new UserDescription(long)).toThrow();
  });

  it("allows 500 characters", () => {
    const max = "a".repeat(500);
    const desc = new UserDescription(max);
    expect(desc.value).toBe(max);
  });
});

describe("UserAvatarUrl", () => {
  it("creates with S3 key pattern", () => {
    const url = new UserAvatarUrl("avatars/user-123.jpg");
    expect(url.value).toBe("avatars/user-123.jpg");
  });

  it("throws on empty string", () => {
    expect(() => new UserAvatarUrl("")).toThrow();
  });
});
```

- [ ] **Step 2: Run tests**

```bash
pnpm --filter @acaixinha/api test -- src/user/domain/__tests__/value-objects.test.ts
```
Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/user/domain/__tests__/value-objects.test.ts
git commit -m "test(api): add unit tests for User value objects"
```

---

### Task 3: User domain tests — Aggregate + Events

**Files:**
- Create: `apps/api/src/user/domain/__tests__/user.test.ts`

- [ ] **Step 1: Create User aggregate + event + exception tests**

```typescript
// apps/api/src/user/domain/__tests__/user.test.ts
import { describe, it, expect } from "vitest";
import { User } from "../models/User";
import { UserId } from "../value-objects/UserId";
import { UserName } from "../value-objects/UserName";
import { UserUsername } from "../value-objects/UserUsername";
import { UserCreatedEvent } from "../events/UserCreatedEvent";
import { UserProfileUpdatedEvent } from "../events/UserProfileUpdatedEvent";
import { UserMemorySharedEvent } from "../events/UserMemorySharedEvent";
import { UserNotFoundException } from "../exceptions/UserNotFoundException";
import { UserAlreadyExistsException } from "../exceptions/UserAlreadyExistsException";
import { InvalidUsernameException } from "../exceptions/InvalidUsernameException";

describe("User aggregate", () => {
  const id = new UserId("550e8400-e29b-41d4-a716-446655440000");
  const name = new UserName("Anxo");
  const username = new UserUsername("anxo_gcd");

  it("creates user and records UserCreatedEvent", () => {
    const user = User.create({ id, name, username });
    expect(user.id.equals(id)).toBe(true);
    expect(user.name.value).toBe("Anxo");
    expect(user.username.value).toBe("anxo_gcd");
    expect(user.ownMemoryIds.size).toBe(0);
    expect(user.sharedMemoryIds.size).toBe(0);

    const events = user.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(UserCreatedEvent);
    const event = events[0] as UserCreatedEvent;
    expect(event.userId).toBe(id.value);
    expect(event.username).toBe("anxo_gcd");
  });

  it("updateProfile records UserProfileUpdatedEvent", () => {
    const user = User.create({ id, name, username });
    user.pullEvents();

    user.updateProfile(new UserName("Anxo Updated"), undefined, undefined);
    const events = user.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(UserProfileUpdatedEvent);
  });

  it("addOwnMemory adds memory id to set", () => {
    const user = User.create({ id, name, username });
    user.addOwnMemory("mem-1");
    expect(user.ownMemoryIds.has("mem-1")).toBe(true);
    expect(user.ownMemoryIds.size).toBe(1);
  });

  it("removeOwnMemory removes memory id from set", () => {
    const user = User.create({ id, name, username });
    user.addOwnMemory("mem-1");
    user.removeOwnMemory("mem-1");
    expect(user.ownMemoryIds.has("mem-1")).toBe(false);
    expect(user.ownMemoryIds.size).toBe(0);
  });

  it("addSharedMemory records UserMemorySharedEvent", () => {
    const user = User.create({ id, name, username });
    user.pullEvents();

    user.addSharedMemory("mem-1");
    expect(user.sharedMemoryIds.has("mem-1")).toBe(true);

    const events = user.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(UserMemorySharedEvent);
  });

  it("removeSharedMemory removes shared memory id", () => {
    const user = User.create({ id, name, username });
    user.addSharedMemory("mem-1");
    user.pullEvents();

    user.removeSharedMemory("mem-1");
    expect(user.sharedMemoryIds.has("mem-1")).toBe(false);
  });

  it("has createdAt and updatedAt timestamps", () => {
    const user = User.create({ id, name, username });
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });
});

describe("Domain exceptions", () => {
  const id = new UserId("550e8400-e29b-41d4-a716-446655440000");

  it("UserNotFoundException has correct code and message", () => {
    const ex = new UserNotFoundException(id.value);
    expect(ex.message).toContain(id.value);
    expect(ex.code).toBe("USER_NOT_FOUND");
  });

  it("UserAlreadyExistsException has correct code", () => {
    const ex = new UserAlreadyExistsException("anxo");
    expect(ex.message).toContain("anxo");
    expect(ex.code).toBe("USER_ALREADY_EXISTS");
  });

  it("InvalidUsernameException has correct code", () => {
    const ex = new InvalidUsernameException("bad user");
    expect(ex.message).toContain("bad user");
    expect(ex.code).toBe("INVALID_USERNAME");
  });
});
```

- [ ] **Step 2: Run tests**

```bash
pnpm --filter @acaixinha/api test -- src/user/domain/__tests__/
```
Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/user/domain/__tests__/user.test.ts
git commit -m "test(api): add unit tests for User aggregate, events, and exceptions"
```

---

### Task 4: Memory domain tests — Value Objects

**Files:**
- Create: `apps/api/src/memory/domain/__tests__/value-objects.test.ts`

- [ ] **Step 1: Create Memory VO tests**

```typescript
// apps/api/src/memory/domain/__tests__/value-objects.test.ts
import { describe, it, expect } from "vitest";
import { MemoryId } from "../value-objects/MemoryId";
import { MemoryTitle } from "../value-objects/MemoryTitle";
import { MemoryDescription } from "../value-objects/MemoryDescription";
import { LocationName } from "../value-objects/LocationName";
import { Coordinates } from "../value-objects/Coordinates";
import { Tag } from "../value-objects/Tag";
import { AttachmentId } from "../value-objects/AttachmentId";
import { S3Key } from "../value-objects/S3Key";
import { MimeType } from "../value-objects/MimeType";

describe("MemoryId", () => {
  const validUuid = "660e8400-e29b-41d4-a716-446655440001";

  it("creates with valid UUID", () => {
    const id = new MemoryId(validUuid);
    expect(id.value).toBe(validUuid);
  });

  it("throws on invalid UUID", () => {
    expect(() => new MemoryId("not-a-uuid")).toThrow();
  });
});

describe("MemoryTitle", () => {
  it("creates with valid title", () => {
    const title = new MemoryTitle("My Memory");
    expect(title.value).toBe("My Memory");
  });

  it("throws on empty string", () => {
    expect(() => new MemoryTitle("")).toThrow();
  });

  it("throws on string exceeding 200 characters", () => {
    expect(() => new MemoryTitle("a".repeat(201))).toThrow();
  });
});

describe("MemoryDescription", () => {
  it("creates with valid description", () => {
    const desc = new MemoryDescription("A description");
    expect(desc.value).toBe("A description");
  });

  it("allows empty string", () => {
    const desc = new MemoryDescription("");
    expect(desc.value).toBe("");
  });

  it("throws on string exceeding 10000 characters", () => {
    expect(() => new MemoryDescription("a".repeat(10001))).toThrow();
  });
});

describe("LocationName", () => {
  it("creates with valid name", () => {
    const loc = new LocationName("Santiago");
    expect(loc.value).toBe("Santiago");
  });

  it("allows empty string", () => {
    const loc = new LocationName("");
    expect(loc.value).toBe("");
  });

  it("throws on string exceeding 200 characters", () => {
    expect(() => new LocationName("a".repeat(201))).toThrow();
  });
});

describe("Coordinates", () => {
  it("creates with valid coordinates", () => {
    const coords = new Coordinates(42.8782, -8.5448);
    expect(coords.latitude).toBe(42.8782);
    expect(coords.longitude).toBe(-8.5448);
  });

  it("throws on latitude below -90", () => {
    expect(() => new Coordinates(-91, 0)).toThrow();
  });

  it("throws on latitude above 90", () => {
    expect(() => new Coordinates(91, 0)).toThrow();
  });

  it("throws on longitude below -180", () => {
    expect(() => new Coordinates(0, -181)).toThrow();
  });

  it("throws on longitude above 180", () => {
    expect(() => new Coordinates(0, 181)).toThrow();
  });

  it("allows boundary values", () => {
    const coords = new Coordinates(-90, 180);
    expect(coords.latitude).toBe(-90);
    expect(coords.longitude).toBe(180);
  });

  it("equals returns true for same coordinates", () => {
    const a = new Coordinates(42, -8);
    const b = new Coordinates(42, -8);
    expect(a.equals(b)).toBe(true);
  });

  it("equals returns false for different coordinates", () => {
    const a = new Coordinates(42, -8);
    const b = new Coordinates(43, -8);
    expect(a.equals(b)).toBe(false);
  });
});

describe("Tag", () => {
  it("creates with valid lowercase tag", () => {
    const tag = new Tag("vacaciones");
    expect(tag.value).toBe("vacaciones");
  });

  it("allows underscores and hyphens", () => {
    const tag = new Tag("viaje_2024-verano");
    expect(tag.value).toBe("viaje_2024-verano");
  });

  it("throws on uppercase", () => {
    expect(() => new Tag("Vacaciones")).toThrow();
  });

  it("throws on spaces", () => {
    expect(() => new Tag("viaje verano")).toThrow();
  });

  it("throws on empty string", () => {
    expect(() => new Tag("")).toThrow();
  });

  it("throws on tag exceeding 50 characters", () => {
    expect(() => new Tag("a".repeat(51))).toThrow();
  });
});

describe("AttachmentId", () => {
  it("creates with valid UUID", () => {
    const id = new AttachmentId("770e8400-e29b-41d4-a716-446655440002");
    expect(id.value).toBe("770e8400-e29b-41d4-a716-446655440002");
  });

  it("throws on invalid UUID", () => {
    expect(() => new AttachmentId("not-uuid")).toThrow();
  });
});

describe("S3Key", () => {
  it("creates with valid S3 key", () => {
    const key = new S3Key("memories/mem-1/att-1.jpg");
    expect(key.value).toBe("memories/mem-1/att-1.jpg");
  });

  it("throws on empty string", () => {
    expect(() => new S3Key("")).toThrow();
  });
});

describe("MimeType", () => {
  it("creates with valid image MIME type", () => {
    const mime = new MimeType("image/jpeg");
    expect(mime.value).toBe("image/jpeg");
  });

  it("creates with valid video MIME type", () => {
    const mime = new MimeType("video/mp4");
    expect(mime.value).toBe("video/mp4");
  });

  it("creates with valid PDF MIME type", () => {
    const mime = new MimeType("application/pdf");
    expect(mime.value).toBe("application/pdf");
  });

  it("throws on empty string", () => {
    expect(() => new MimeType("")).toThrow();
  });

  it("throws on invalid MIME type", () => {
    expect(() => new MimeType("text/html")).toThrow();
  });

  it("throws on arbitrary string", () => {
    expect(() => new MimeType("not-a-mime")).toThrow();
  });
});
```

- [ ] **Step 2: Run tests**

```bash
pnpm --filter @acaixinha/api test -- src/memory/domain/__tests__/value-objects.test.ts
```
Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/memory/domain/__tests__/value-objects.test.ts
git commit -m "test(api): add unit tests for Memory value objects"
```

---

### Task 5: Memory domain tests — Aggregate + Events + Service

**Files:**
- Create: `apps/api/src/memory/domain/__tests__/memory.test.ts`
- Create: `apps/api/src/memory/domain/__tests__/memory-sharing.test.ts`

- [ ] **Step 1: Create Memory aggregate + event tests**

```typescript
// apps/api/src/memory/domain/__tests__/memory.test.ts
import { describe, it, expect } from "vitest";
import { Memory } from "../models/Memory";
import { MemoryId } from "../value-objects/MemoryId";
import { MemoryTitle } from "../value-objects/MemoryTitle";
import { MemoryDescription } from "../value-objects/MemoryDescription";
import { Tag } from "../value-objects/Tag";
import { Coordinates } from "../value-objects/Coordinates";
import { Attachment } from "../models/Attachment";
import { AttachmentId } from "../value-objects/AttachmentId";
import { S3Key } from "../value-objects/S3Key";
import { MimeType } from "../value-objects/MimeType";
import { LocationName } from "../value-objects/LocationName";
import { MemoryCreatedEvent } from "../events/MemoryCreatedEvent";
import { MemoryUpdatedEvent } from "../events/MemoryUpdatedEvent";
import { MemoryDeletedEvent } from "../events/MemoryDeletedEvent";
import { MemorySharedEvent } from "../events/MemorySharedEvent";
import { AttachmentAddedEvent } from "../events/AttachmentAddedEvent";
import { AttachmentLimitExceededException } from "../exceptions/AttachmentLimitExceededException";
import { UnauthorizedMemoryAccessException } from "../exceptions/UnauthorizedMemoryAccessException";

const ownerId = "user-1";
const memoryId = new MemoryId("880e8400-e29b-41d4-a716-446655440003");

describe("Memory aggregate", () => {
  it("creates memory and records MemoryCreatedEvent", () => {
    const memory = Memory.create({
      id: memoryId,
      title: new MemoryTitle("Test Memory"),
      description: new MemoryDescription("A test memory"),
      memoryDate: new Date("2024-01-15"),
      ownerId,
    });

    expect(memory.id.equals(memoryId)).toBe(true);
    expect(memory.title.value).toBe("Test Memory");
    expect(memory.description.value).toBe("A test memory");
    expect(memory.ownerId).toBe(ownerId);
    expect(memory.tags.size).toBe(0);
    expect(memory.sharedWithUserIds.size).toBe(0);
    expect(memory.attachments).toHaveLength(0);

    const events = memory.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(MemoryCreatedEvent);
  });

  it("creates memory with optional location and coordinates", () => {
    const memory = Memory.create({
      id: memoryId,
      title: new MemoryTitle("Location Memory"),
      description: new MemoryDescription("With location"),
      memoryDate: new Date(),
      ownerId,
      locationName: new LocationName("Santiago"),
      coordinates: new Coordinates(42.8782, -8.5448),
    });

    expect(memory.locationName?.value).toBe("Santiago");
    expect(memory.coordinates?.latitude).toBe(42.8782);
    expect(memory.coordinates?.longitude).toBe(-8.5448);
  });

  it("isOwner returns true for owner", () => {
    const memory = createMemory();
    expect(memory.isOwner(ownerId)).toBe(true);
  });

  it("isOwner returns false for non-owner", () => {
    const memory = createMemory();
    expect(memory.isOwner("other-user")).toBe(false);
  });

  it("isSharedWith returns true for shared user", () => {
    const memory = createMemory();
    memory.shareWithUser("user-2");
    expect(memory.isSharedWith("user-2")).toBe(true);
  });

  it("isSharedWith returns false for non-shared user", () => {
    const memory = createMemory();
    expect(memory.isSharedWith("user-3")).toBe(false);
  });

  it("canUserAddAttachment returns true for owner", () => {
    const memory = createMemory();
    expect(memory.canUserAddAttachment(ownerId)).toBe(true);
  });

  it("canUserAddAttachment returns true for shared user", () => {
    const memory = createMemory();
    memory.shareWithUser("user-2");
    expect(memory.canUserAddAttachment("user-2")).toBe(true);
  });

  it("canUserAddAttachment returns false for unauthorized user", () => {
    const memory = createMemory();
    expect(memory.canUserAddAttachment("stranger")).toBe(false);
  });

  it("updateDetails records MemoryUpdatedEvent", () => {
    const memory = createMemory();
    memory.pullEvents();

    memory.updateDetails({
      title: new MemoryTitle("Updated Title"),
    });

    const events = memory.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(MemoryUpdatedEvent);
    expect(memory.title.value).toBe("Updated Title");
    expect(memory.description.value).toBe("A test memory");
  });

  it("addTag and removeTag manage tags set", () => {
    const memory = createMemory();
    const tag = new Tag("vacaciones");

    memory.addTag(tag);
    expect(memory.tags.has(tag)).toBe(true);
    expect(memory.tags.size).toBe(1);

    memory.removeTag(tag);
    expect(memory.tags.size).toBe(0);
  });

  it("shareWithUser records MemorySharedEvent", () => {
    const memory = createMemory();
    memory.pullEvents();

    memory.shareWithUser("user-2");
    expect(memory.sharedWithUserIds.has("user-2")).toBe(true);

    const events = memory.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(MemorySharedEvent);
  });

  it("unshareWithUser removes shared user", () => {
    const memory = createMemory();
    memory.shareWithUser("user-2");
    memory.pullEvents();

    memory.unshareWithUser("user-2");
    expect(memory.sharedWithUserIds.has("user-2")).toBe(false);
  });

  it("addAttachment records AttachmentAddedEvent", () => {
    const memory = createMemory();
    memory.pullEvents();

    const attachment = Attachment.create({
      id: new AttachmentId("990e8400-e29b-41d4-a716-446655440004"),
      s3Key: new S3Key("memories/mem-1/att-1.jpg"),
      mimeType: new MimeType("image/jpeg"),
      uploadedByUserId: ownerId,
    });

    memory.addAttachment(attachment);
    expect(memory.attachments).toHaveLength(1);
    expect(memory.attachments[0].id.equals(attachment.id)).toBe(true);

    const events = memory.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(AttachmentAddedEvent);
  });

  it("delete records MemoryDeletedEvent when called by owner", () => {
    const memory = createMemory();
    memory.pullEvents();

    memory.delete(ownerId);
    const events = memory.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(MemoryDeletedEvent);
  });

  it("delete throws for non-owner", () => {
    const memory = createMemory();
    expect(() => memory.delete("other-user")).toThrow(UnauthorizedMemoryAccessException);
  });

  it("removeAttachment succeeds for owner", () => {
    const memory = createMemory();
    const attId = new AttachmentId("aa0e8400-e29b-41d4-a716-446655440005");
    const attachment = Attachment.create({
      id: attId,
      s3Key: new S3Key("memories/mem-1/att-1.jpg"),
      mimeType: new MimeType("image/jpeg"),
      uploadedByUserId: ownerId,
    });
    memory.addAttachment(attachment);
    memory.pullEvents();

    memory.removeAttachment(attId, ownerId);
    expect(memory.attachments).toHaveLength(0);
  });

  it("removeAttachment succeeds for uploader (non-owner)", () => {
    const memory = createMemory();
    const attId = new AttachmentId("bb0e8400-e29b-41d4-a716-446655440006");
    const attachment = Attachment.create({
      id: attId,
      s3Key: new S3Key("memories/mem-1/att-1.jpg"),
      mimeType: new MimeType("image/jpeg"),
      uploadedByUserId: "user-2",
    });
    memory.addAttachment(attachment);
    memory.pullEvents();

    memory.removeAttachment(attId, "user-2");
    expect(memory.attachments).toHaveLength(0);
  });

  it("removeAttachment throws for non-owner non-uploader", () => {
    const memory = createMemory();
    const attId = new AttachmentId("cc0e8400-e29b-41d4-a716-446655440007");
    const attachment = Attachment.create({
      id: attId,
      s3Key: new S3Key("memories/mem-1/att-1.jpg"),
      mimeType: new MimeType("image/jpeg"),
      uploadedByUserId: ownerId,
    });
    memory.addAttachment(attachment);

    expect(() => memory.removeAttachment(attId, "stranger")).toThrow(
      UnauthorizedMemoryAccessException,
    );
  });
});

function createMemory(): Memory {
  return Memory.create({
    id: memoryId,
    title: new MemoryTitle("Test Memory"),
    description: new MemoryDescription("A test memory"),
    memoryDate: new Date("2024-01-15"),
    ownerId,
  });
}
```

- [ ] **Step 2: Run tests**

```bash
pnpm --filter @acaixinha/api test -- src/memory/domain/__tests__/memory.test.ts
```
Expected: all tests pass.

- [ ] **Step 3: Create MemorySharingService test**

```typescript
// apps/api/src/memory/domain/__tests__/memory-sharing.test.ts
import { describe, it, expect } from "vitest";
import { MemorySharingService } from "../services/MemorySharingService";
import { Memory } from "../models/Memory";
import { MemoryId } from "../value-objects/MemoryId";
import { MemoryTitle } from "../value-objects/MemoryTitle";
import { MemoryDescription } from "../value-objects/MemoryDescription";
import { User } from "../../../user/domain/models/User";
import { UserId } from "../../../user/domain/value-objects/UserId";
import { UserName } from "../../../user/domain/value-objects/UserName";
import { UserUsername } from "../../../user/domain/value-objects/UserUsername";

describe("MemorySharingService", () => {
  const service = new MemorySharingService();

  it("shareMemory adds userId to memory sharedWith and memoryId to user sharedMemories", () => {
    const memory = makeMemory();
    const user = makeUser("user-2");

    service.shareMemory(memory, user);

    expect(memory.sharedWithUserIds.has("user-2")).toBe(true);
    expect(user.sharedMemoryIds.has(memory.id.value)).toBe(true);
  });

  it("unshareMemory removes userId from memory and memoryId from user", () => {
    const memory = makeMemory();
    const user = makeUser("user-2");
    service.shareMemory(memory, user);

    service.unshareMemory(memory, user);

    expect(memory.sharedWithUserIds.has("user-2")).toBe(false);
    expect(user.sharedMemoryIds.has(memory.id.value)).toBe(false);
  });
});

function makeMemory(): Memory {
  return Memory.create({
    id: new MemoryId("880e8400-e29b-41d4-a716-446655440003"),
    title: new MemoryTitle("Test"),
    description: new MemoryDescription("Desc"),
    memoryDate: new Date(),
    ownerId: "user-1",
  });
}

function makeUser(idStr: string): User {
  return User.create({
    id: new UserId(idStr),
    name: new UserName("Test User"),
    username: new UserUsername("test_user"),
  });
}
```

- [ ] **Step 4: Run all Memory tests**

```bash
pnpm --filter @acaixinha/api test -- src/memory/domain/__tests__/
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/memory/domain/__tests__/
git commit -m "test(api): add unit tests for Memory aggregate, events, and MemorySharingService"
```

---

### Task 6: Run full test suite + coverage

**Files:**
- None new. Verification only.

- [ ] **Step 1: Run all tests**

```bash
pnpm --filter @acaixinha/api test
```
Expected: all domain tests pass.

- [ ] **Step 2: Run coverage**

```bash
pnpm --filter @acaixinha/api test:coverage
```
Expected: coverage report shows domain coverage.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A && git commit -m "fix(api): resolve test failures if any"
```

---

### Task 7: GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create CI workflow**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  lint-typecheck:
    name: Lint & Typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - run: pnpm lint
      - run: pnpm run build --filter @acaixinha/shared
      - name: Typecheck API
        run: npx tsc -b packages/shared apps/api --noEmit

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - run: pnpm --filter @acaixinha/api test:coverage

      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: apps/api/coverage/

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - run: pnpm run build --filter @acaixinha/api
      - run: pnpm --filter @acaixinha/web build
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "feat(ci): add GitHub Actions CI workflow (lint, typecheck, test, build)"
```