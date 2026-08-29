import { describe, expect, it } from "vitest";
import {
  BOOK_STATUSES,
  ETAS,
  FORMAT_BADGE,
  PAYMENT_BADGE,
  PAYMENT_LABEL,
  STATUSES,
  STATUS_BADGE,
  STATUS_LABEL,
  etaLabel,
} from "./orderOptions";

describe("etaLabel", () => {
  it("returns an em dash when absent", () => {
    expect(etaLabel(null)).toBe("—");
    expect(etaLabel(undefined)).toBe("—");
  });

  it("maps known ETA codes to Indonesian month labels", () => {
    expect(etaLabel("JAN")).toBe("Januari");
    expect(etaLabel("AUG")).toBe("Agustus");
    expect(etaLabel("DEC")).toBe("Desember");
  });

  it("falls back to the raw value for unknown codes", () => {
    expect(etaLabel("XYZ")).toBe("XYZ");
  });
});

describe("label maps", () => {
  it("covers every order status", () => {
    for (const { value, label } of STATUSES) {
      expect(STATUS_LABEL[value]).toBe(label);
    }
  });

  it("covers every payment status", () => {
    for (const payment of ["NO_PAYMENT", "DONE_DP", "LUNAS"] as const) {
      expect(PAYMENT_LABEL[payment]).toBeTruthy();
    }
    expect(PAYMENT_LABEL.LUNAS).toBe("Fully Paid");
    expect(PAYMENT_LABEL.NO_PAYMENT).toBe("Unpaid");
    expect(PAYMENT_LABEL.DONE_DP).toBe("Deposit Paid");
  });

  it("covers every ETA code", () => {
    for (const eta of ETAS) {
      expect(etaLabel(eta.value)).toBe(eta.label);
    }
  });

  it("has a badge class for each status, payment, and format", () => {
    for (const { value } of STATUSES) {
      expect(STATUS_BADGE[value]).toMatch(/border-/);
    }
    for (const key of Object.keys(PAYMENT_LABEL)) {
      expect(PAYMENT_BADGE[key]).toMatch(/border-/);
    }
    for (const key of ["HC", "PB", "BB", "SET", "SB"]) {
      expect(FORMAT_BADGE[key]).toMatch(/border-/);
    }
  });

  it("has two book statuses", () => {
    expect(BOOK_STATUSES.map((b) => b.value)).toEqual(["READY_STOCK", "PRE_ORDER"]);
  });
});
