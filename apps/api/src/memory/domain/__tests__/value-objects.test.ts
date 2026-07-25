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