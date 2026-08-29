import { describe, expect, it } from "vitest";
import { DEFAULT_PAGE_SIZE, PAGE_SIZES, parsePerPage, perQuery } from "./pagination";

describe("parsePerPage", () => {
  it("defaults when value is absent", () => {
    expect(parsePerPage(undefined)).toBe(DEFAULT_PAGE_SIZE);
    expect(parsePerPage(null)).toBe(DEFAULT_PAGE_SIZE);
    expect(parsePerPage("")).toBe(DEFAULT_PAGE_SIZE);
  });

  it("defaults when value is invalid or out of range", () => {
    expect(parsePerPage("abc")).toBe(DEFAULT_PAGE_SIZE);
    expect(parsePerPage("NaN")).toBe(DEFAULT_PAGE_SIZE);
    expect(parsePerPage("25")).toBe(DEFAULT_PAGE_SIZE);
    expect(parsePerPage("0")).toBe(DEFAULT_PAGE_SIZE);
    expect(parsePerPage("-10")).toBe(DEFAULT_PAGE_SIZE);
    expect(parsePerPage("99")).toBe(DEFAULT_PAGE_SIZE);
  });

  it("accepts every allowed page size", () => {
    for (const size of PAGE_SIZES) {
      expect(parsePerPage(String(size))).toBe(size);
    }
  });
});

describe("perQuery", () => {
  it("returns empty string for the default page size", () => {
    expect(perQuery(DEFAULT_PAGE_SIZE)).toBe("");
  });

  it("stringifies non-default page sizes", () => {
    expect(perQuery(10)).toBe("10");
    expect(perQuery(50)).toBe("50");
  });
});
