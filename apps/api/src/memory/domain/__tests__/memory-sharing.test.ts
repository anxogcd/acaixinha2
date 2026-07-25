import { describe, it, expect, beforeEach } from "vitest";
import { MemorySharingService } from "../services/MemorySharingService.js";
import { Memory } from "../models/Memory.js";
import { MemoryId } from "../value-objects/MemoryId.js";
import { MemoryTitle } from "../value-objects/MemoryTitle.js";
import { MemoryDescription } from "../value-objects/MemoryDescription.js";
import { User } from "../../../user/domain/models/User.js";
import { UserId } from "../../../user/domain/value-objects/UserId.js";
import { UserName } from "../../../user/domain/value-objects/UserName.js";
import { UserUsername } from "../../../user/domain/value-objects/UserUsername.js";

const memoryId = new MemoryId("880e8400-e29b-41d4-a716-446655440003");
const targetUserIdStr = "bb0e8400-e29b-41d4-a716-446655440002";

describe("MemorySharingService", () => {
  let service: MemorySharingService;
  let memory: Memory;
  let user: User;

  beforeEach(() => {
    service = new MemorySharingService();
    memory = makeMemory();
    user = makeUser(targetUserIdStr);
  });

  it("shareMemory adds userId to memory sharedWith and memoryId to user sharedMemories", () => {
    service.shareMemory(memory, user);

    expect(memory.sharedWithUserIds.has(targetUserIdStr)).toBe(true);
    expect(user.sharedMemoryIds.has(memory.id.value)).toBe(true);
  });

  it("unshareMemory removes userId from memory and memoryId from user", () => {
    service.shareMemory(memory, user);

    service.unshareMemory(memory, user);

    expect(memory.sharedWithUserIds.has(targetUserIdStr)).toBe(false);
    expect(user.sharedMemoryIds.has(memory.id.value)).toBe(false);
  });

  it("shareMemory is idempotent for memory sharedWith", () => {
    service.shareMemory(memory, user);
    const eventCountBefore = memory.pullEvents().length;

    service.shareMemory(memory, user);
    expect(memory.sharedWithUserIds.has(targetUserIdStr)).toBe(true);
    const eventsAfter = memory.pullEvents();
    expect(eventsAfter).toHaveLength(0);
  });

  it("shareMemory records MemorySharedEvent and UserMemorySharedEvent", () => {
    service.shareMemory(memory, user);

    const memoryEvents = memory.pullEvents();
    expect(memoryEvents.length).toBeGreaterThanOrEqual(1);

    const userEvents = user.pullEvents();
    expect(userEvents.length).toBeGreaterThanOrEqual(1);
  });
});

function makeMemory(): Memory {
  return Memory.create({
    id: memoryId,
    title: new MemoryTitle("Test"),
    description: new MemoryDescription("Desc"),
    memoryDate: new Date(),
    locationName: null,
    coordinates: null,
    ownerId: "user-1",
  });
}

function makeUser(idStr: string): User {
  return User.create({
    id: new UserId(idStr),
    name: new UserName("Test User"),
    username: new UserUsername("testuser1"),
  });
}