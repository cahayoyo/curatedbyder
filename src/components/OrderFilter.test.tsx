import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderFilter } from "./OrderFilter";
import { PAYMENT_STATUSES, STATUSES } from "@/lib/orderOptions";

const nav = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}));

const transition = vi.hoisted(() => ({
  pending: false,
  start: (fn: () => void) => fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useTransition: () => [transition.pending, transition.start],
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push }),
  useSearchParams: () => nav.searchParams,
}));

function renderFilter() {
  const view = render(
    <OrderFilter basePath="/admin/orders" batches={[{ id: "b1", name: "Batch 1" }]} />
  );
  return view;
}

async function openPanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /^Filter/ }));
}

beforeEach(() => {
  vi.clearAllMocks();
  nav.searchParams = new URLSearchParams();
  transition.pending = false;
});

describe("OrderFilter", () => {
  it("renders no spinner and enabled controls when idle", async () => {
    const user = userEvent.setup();
    renderFilter();
    await openPanel(user);

    expect(screen.getByRole("button", { name: /^Filter/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Reset Filter" })).toBeEnabled();
    screen.getAllByRole("checkbox").forEach((cb) => expect(cb).toBeEnabled());
    screen.getAllByRole("combobox").forEach((sel) => expect(sel).toBeEnabled());
    expect(document.querySelectorAll(".animate-spin")).toHaveLength(0);
  });

  it("spins and disables all controls while pending", async () => {
    const user = userEvent.setup();
    const view = renderFilter();
    await openPanel(user);

    transition.pending = true;
    view.rerender(
      <OrderFilter basePath="/admin/orders" batches={[{ id: "b1", name: "Batch 1" }]} />
    );

    expect(screen.getByRole("button", { name: /^Filter/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reset Filter" })).toBeDisabled();
    screen.getAllByRole("checkbox").forEach((cb) => expect(cb).toBeDisabled());
    screen.getAllByRole("combobox").forEach((sel) => expect(sel).toBeDisabled());
    expect(document.querySelectorAll(".animate-spin")).toHaveLength(1);
  });

  it("toggles a payment status and drops the page param", async () => {
    const user = userEvent.setup();
    nav.searchParams = new URLSearchParams(`page=3&paymentStatus=${PAYMENT_STATUSES[1].value}`);
    renderFilter();
    await openPanel(user);

    await user.click(screen.getAllByRole("checkbox")[0]);
    expect(nav.push).toHaveBeenCalledWith(
      `/admin/orders?paymentStatus=${PAYMENT_STATUSES[1].value}%2C${PAYMENT_STATUSES[0].value}`
    );
  });

  it("pushes order status, batch, eta, and date selections", async () => {
    const user = userEvent.setup();
    renderFilter();
    await openPanel(user);

    await user.selectOptions(screen.getAllByRole("combobox")[0], STATUSES[0].value);
    expect(nav.push).toHaveBeenCalledWith(`/admin/orders?status=${STATUSES[0].value}`);

    await user.selectOptions(screen.getAllByRole("combobox")[1], "b1");
    expect(nav.push).toHaveBeenCalledWith("/admin/orders?batch=b1");
  });

  it("reset removes all filter params", async () => {
    const user = userEvent.setup();
    nav.searchParams = new URLSearchParams("status=DIKIRIM&batch=b1&paymentStatus=LUNAS&page=2");
    renderFilter();
    await openPanel(user);

    await user.click(screen.getByRole("button", { name: "Reset Filter" }));
    expect(nav.push).toHaveBeenCalledWith("/admin/orders?");
  });
});