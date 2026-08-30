import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BuyerTabs } from "./BuyerTabs";
import { BuyerNavContext } from "./BuyerShell";

const nav = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => nav.searchParams,
}));

function renderTabs(pending: boolean, defaultTab = "invoice") {
  const ui = (p: boolean) => (
    <BuyerNavContext.Provider value={{ pending: p, navigate: nav.push }}>
      <BuyerTabs
        orders={[]}
        total={0}
        page={1}
        pageSize={10}
        basePath="/dashboard"
        query={{}}
        defaultTab={defaultTab}
      />
    </BuyerNavContext.Provider>
  );
  const view = render(ui(pending));
  return { ...view, setPending: (p: boolean) => view.rerender(ui(p)) };
}

beforeEach(() => {
  vi.clearAllMocks();
  nav.searchParams = new URLSearchParams();
});

describe("BuyerTabs", () => {
  it("navigates to ?tab=payment", async () => {
    const user = userEvent.setup();
    renderTabs(false);

    await user.click(screen.getByRole("tab", { name: /Pembayaran/ }));
    expect(nav.push).toHaveBeenCalledTimes(1);
    expect(nav.push).toHaveBeenCalledWith("/dashboard?tab=payment");
  });

  it("navigates to ?tab=shipment", async () => {
    const user = userEvent.setup();
    renderTabs(false);

    await user.click(screen.getByRole("tab", { name: /Lacak/ }));
    expect(nav.push).toHaveBeenCalledTimes(1);
    expect(nav.push).toHaveBeenCalledWith("/dashboard?tab=shipment");
  });

  it("drops the tab param when switching back to invoice", async () => {
    const user = userEvent.setup();
    renderTabs(false, "payment");

    await user.click(screen.getByRole("tab", { name: /Invoice/ }));
    expect(nav.push).toHaveBeenCalledTimes(1);
    expect(nav.push).toHaveBeenCalledWith("/dashboard?");
  });

  it("shows spinners on tab triggers while pending, icons when idle", () => {
    const { setPending } = renderTabs(false);
    expect(document.querySelectorAll(".animate-spin")).toHaveLength(0);

    setPending(true);
    expect(document.querySelectorAll(".animate-spin")).toHaveLength(3);

    setPending(false);
    expect(document.querySelectorAll(".animate-spin")).toHaveLength(0);
  });
});
