import { describe, expect, it } from "vitest";
import { dateLabel, formatIDR, formatRp } from "./format";

describe("formatIDR", () => {
  it("returns an em dash for null or undefined", () => {
    expect(formatIDR(null)).toBe("—");
    expect(formatIDR(undefined)).toBe("—");
  });

  it("formats amounts in IDR without decimals", () => {
    expect(formatIDR(0)).toMatch(/^Rp\s?0$/);
    expect(formatIDR(150000)).toMatch(/^Rp\s?150\.000$/);
    expect(formatIDR(1000000)).toMatch(/^Rp\s?1\.000\.000$/);
  });
});

describe("formatRp", () => {
  it("groups digits with dots", () => {
    expect(formatRp("150000")).toBe("150.000");
    expect(formatRp("1000000")).toBe("1.000.000");
  });

  it("strips non-digit characters first", () => {
    expect(formatRp("rp150.000")).toBe("150.000");
    expect(formatRp("12a34")).toBe("1.234");
  });

  it("returns empty string when no digits remain", () => {
    expect(formatRp("")).toBe("");
    expect(formatRp("abc")).toBe("");
  });
});

describe("dateLabel", () => {
  it("formats a Date in long Indonesian format", () => {
    expect(dateLabel(new Date(2026, 7, 29))).toBe("29 Agustus 2026");
  });

  it("accepts an ISO string", () => {
    expect(dateLabel(new Date(2026, 0, 1).toISOString())).toBe("1 Januari 2026");
  });
});
