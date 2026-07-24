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

    user.updateProfile(new UserName("Anxo Updated"), null, null);
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

    user.addSharedMemory("mem-1", "shared-by-user-1");
    expect(user.sharedMemoryIds.has("mem-1")).toBe(true);

    const events = user.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(UserMemorySharedEvent);
  });

  it("removeSharedMemory removes shared memory id", () => {
    const user = User.create({ id, name, username });
    user.addSharedMemory("mem-1", "shared-by-user-1");
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