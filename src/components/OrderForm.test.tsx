import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderForm } from "./OrderForm";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  createOrder: vi.fn(),
  updateOrder: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: mocks.replace,
    refresh: mocks.refresh,
    back: mocks.back,
  }),
}));

vi.mock("@/server/actions/orders", () => ({
  createOrder: mocks.createOrder,
  updateOrder: mocks.updateOrder,
}));

vi.mock("@/components/SuccessModal", () => ({
  useSuccessModal: () => ({ success: mocks.success, error: mocks.error }),
}));

const props = {
  buyers: [{ id: "u1", name: "Buyer A" }],
  books: [{ id: "bk1", title: "Anak Pelangi", price: 100000, stock: 20 }],
  batches: [{ id: "bt1", name: "SAMPLE-2026-08" }],
  batchPrices: [{ batchId: "bt1", bookId: "bk1", price: 100000 }],
};

function productTrigger() {
  const group = screen.getByText("Nama Produk").closest("div")!;
  return within(group).getByRole("combobox");
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OrderForm product variants", () => {
  it("gives base and batch variants unique values when prices collide", async () => {
    const user = userEvent.setup();
    const { baseElement } = render(<OrderForm {...props} />);

    await user.click(productTrigger());
    const values = Array.from(
      baseElement.querySelectorAll("select[aria-hidden] option")
    )
      .map((o) => o.getAttribute("value") ?? "")
      .filter((v) => v.includes("::"));

    expect(values).toHaveLength(2);
    expect(new Set(values).size).toBe(2);
  });

  it("shows only the picked variant in the trigger", async () => {
    const user = userEvent.setup();
    render(<OrderForm {...props} />);

    await user.click(productTrigger());
    await user.click(screen.getByRole("option", { name: /SAMPLE-2026-08/ }));

    const text = productTrigger().textContent ?? "";
    expect(text).toContain("Anak Pelangi · SAMPLE-2026-08");
    expect(text.match(/Stok : 20/g)).toHaveLength(1);
    expect(text.match(/Anak Pelangi/g)).toHaveLength(1);
  });
});
