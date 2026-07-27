import { describe, it, expect } from "vitest";
import { formatBytes, formatDuration, cn } from "./utils";

describe("formatBytes", () => {
  it("returns 0 B for zero", () => expect(formatBytes(0)).toBe("0 B"));
  it("formats bytes", () => expect(formatBytes(1024)).toBe("1.0 KB"));
  it("formats megabytes", () => expect(formatBytes(1048576)).toBe("1.0 MB"));
  it("formats gigabytes", () => expect(formatBytes(1073741824)).toBe("1.0 GB"));
  it("handles bigint", () => expect(formatBytes(BigInt(2048))).toBe("2.0 KB"));
});

describe("formatDuration", () => {
  it("formats seconds", () => expect(formatDuration(65)).toBe("1:05"));
  it("formats minutes", () => expect(formatDuration(3661)).toBe("1:01:01"));
  it("formats zero", () => expect(formatDuration(0)).toBe("0:00"));
  it("pads single digits", () => expect(formatDuration(5)).toBe("0:05"));
});

describe("cn", () => {
  it("merges class names", () => expect(cn("px-2", "py-1")).toBe("px-2 py-1"));
  it("handles conditional classes", () => expect(cn("base", false && "hidden")).toBe("base"));
});
