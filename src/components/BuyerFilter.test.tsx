import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BuyerFilter } from "./BuyerFilter";
import { BuyerNavContext } from "./BuyerShell";
import { PAYMENT_STATUSES, STATUSES } from "@/lib/orderOptions";

const nav = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push }),
  useSearchParams: () => nav.searchParams,
}));

function renderFilter(pending: boolean) {
  const ui = (p: boolean) => (
    <BuyerNavContext.Provider value={{ pending: p, navigate: nav.push }}>
      <BuyerFilter basePath="/dashboard" batches={[{ id: "b1", name: "Batch 1" }]} />
    </BuyerNavContext.Provider>
  );
  const view = render(ui(pending));
  return { ...view, setPending: (p: boolean) => view.rerender(ui(p)) };
}

async function openPanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /^Filter/ }));
}

beforeEach(() => {
  vi.clearAllMocks();
  nav.searchParams = new URLSearchParams();
});

describe("BuyerFilter", () => {
  it("disabled all controls while pending", async () => {
    const user = userEvent.setup();
    const { setPending } = renderFilter(false);
    await openPanel(user);
    setPending(true);

    expect(screen.getByRole("button", { name: /^Filter/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reset Filter" })).toBeDisabled();
    screen.getAllByRole("checkbox").forEach((cb) => expect(cb).toBeDisabled());
    screen.getAllByRole("combobox").forEach((sel) => expect(sel).toBeDisabled());
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("toggles a payment status and drops the page param", async () => {
    const user = userEvent.setup();
    nav.searchParams = new URLSearchParams(`page=3&paymentStatus=${PAYMENT_STATUSES[1].value}`);
    renderFilter(false);
    await openPanel(user);

    await user.click(screen.getAllByRole("checkbox")[0]);
    expect(nav.push).toHaveBeenCalledWith(
      `/dashboard?paymentStatus=${PAYMENT_STATUSES[1].value}%2C${PAYMENT_STATUSES[0].value}`
    );
  });

  it("pushes order status and batch selections", async () => {
    const user = userEvent.setup();
    renderFilter(false);
    await openPanel(user);

    await user.selectOptions(screen.getAllByRole("combobox")[0], STATUSES[0].value);
    expect(nav.push).toHaveBeenCalledWith(`/dashboard?status=${STATUSES[0].value}`);

    await user.selectOptions(screen.getAllByRole("combobox")[1], "b1");
    expect(nav.push).toHaveBeenCalledWith("/dashboard?batch=b1");
  });

  it("reset removes all filter params", async () => {
    const user = userEvent.setup();
    nav.searchParams = new URLSearchParams("status=DIKIRIM&batch=b1&paymentStatus=LUNAS&page=2");
    renderFilter(false);
    await openPanel(user);

    await user.click(screen.getByRole("button", { name: "Reset Filter" }));
    expect(nav.push).toHaveBeenCalledWith("/dashboard?");
  });
});
