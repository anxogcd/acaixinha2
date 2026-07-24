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