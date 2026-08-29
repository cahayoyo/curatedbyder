import { describe, expect, it } from "vitest";
import { waLink } from "./wa";

describe("waLink", () => {
  it("normalizes local, international and formatted numbers", () => {
    expect(waLink("081284605363")).toBe("https://api.whatsapp.com/send?phone=6281284605363");
    expect(waLink("+6281284605363")).toBe("https://api.whatsapp.com/send?phone=6281284605363");
    expect(waLink("0812-8460 5363")).toBe("https://api.whatsapp.com/send?phone=6281284605363");
  });

  it("returns null when the phone number has no digits", () => {
    expect(waLink("")).toBeNull();
    expect(waLink("-")).toBeNull();
  });

  it("omits the text param when no text is given", () => {
    expect(waLink("081284605363")).not.toContain("text=");
  });

  it("percent-encodes newlines and reserved characters in the text", () => {
    const link = waLink("081284605363", "Invoice : INVDER-1\nTotal : Rp 22.000");
    expect(link).toBe(
      "https://api.whatsapp.com/send?phone=6281284605363&text=Invoice%20%3A%20INVDER-1%0ATotal%20%3A%20Rp%2022.000",
    );
  });

  // Regression guard for #91: wa.me re-encodes ?text= as Latin-1 and replaces
  // every character outside that range with U+FFFD, stripping emoji from the
  // WhatsApp template. The link must therefore target api.whatsapp.com and
  // carry the emoji as raw UTF-8 percent-encoding.
  it("keeps emoji intact and never routes through wa.me", () => {
    const link = waLink("081284605363", "Halo kak 😊🙏🏼 terima kasih 🤗");
    expect(link).not.toContain("wa.me");
    expect(link).toContain("%F0%9F%98%8A"); // U+1F60A
    expect(link).toContain("%F0%9F%99%8F"); // U+1F64F
    expect(link).toContain("%F0%9F%8F%BC"); // U+1F3FC skin tone modifier
    expect(link).toContain("%F0%9F%A4%97"); // U+1F917
    expect(link).not.toContain("%EF%BF%BD"); // U+FFFD
  });

  it("round-trips the text through URLSearchParams", () => {
    const text = "Selamat pagi, Kak Budi 😊\n\n*Total : Rp 22.000*";
    const link = waLink("081284605363", text);
    expect(new URL(link!).searchParams.get("text")).toBe(text);
  });
});
