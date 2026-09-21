import { describe, expect, it } from "vitest";
import { isPrivateOrReservedIp, normalizeUrl, UrlValidationError } from "@/utils/url";

describe("normalizeUrl", () => {
  it("normalizes bare domains to https", () => {
    const url = normalizeUrl("example.com");
    expect(url.protocol).toBe("https:");
    expect(url.hostname).toBe("example.com");
  });

  it("rejects non-http protocols", () => {
    expect(() => normalizeUrl("file:///etc/passwd")).toThrow(UrlValidationError);
  });

  it("rejects localhost", () => {
    expect(() => normalizeUrl("http://localhost/admin")).toThrow(/local|internal/i);
  });
});

describe("isPrivateOrReservedIp", () => {
  it("detects private and metadata ranges", () => {
    expect(isPrivateOrReservedIp("127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("10.0.0.5")).toBe(true);
    expect(isPrivateOrReservedIp("192.168.1.1")).toBe(true);
    expect(isPrivateOrReservedIp("169.254.169.254")).toBe(true);
    expect(isPrivateOrReservedIp("::1")).toBe(true);
    expect(isPrivateOrReservedIp("8.8.8.8")).toBe(false);
  });
});
