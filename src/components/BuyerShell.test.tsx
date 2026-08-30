import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BuyerNavContext, BuyerShell, PendingDim, useBuyerNav } from "./BuyerShell";

const nav = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push }),
}));

function NavigateProbe() {
  const { pending, navigate } = useBuyerNav("probe");
  return (
    <>
      <button type="button" onClick={() => navigate("/dashboard?status=X")}>
        go
      </button>
      <span data-testid="pending">{String(pending)}</span>
    </>
  );
}

describe("BuyerShell", () => {
  it("navigates through the transition and does not stay pending", async () => {
    const user = userEvent.setup();
    render(
      <BuyerShell>
        <NavigateProbe />
      </BuyerShell>
    );
    await user.click(screen.getByRole("button", { name: "go" }));
    expect(nav.push).toHaveBeenCalledWith("/dashboard?status=X");
    expect(screen.getByTestId("pending")).toHaveTextContent("false");
  });
});

describe("PendingDim", () => {
  it("dims and blocks interaction only while pending", () => {
    const ui = (pending: boolean) => (
      <BuyerNavContext.Provider value={{ pending, source: "", navigate: vi.fn() }}>
        <PendingDim>
          <div>list</div>
        </PendingDim>
      </BuyerNavContext.Provider>
    );
    const { rerender } = render(ui(true));
    const dim = screen.getByText("list").parentElement!;
    expect(dim).toHaveAttribute("aria-busy", "true");
    expect(dim.className).toContain("opacity-50");
    expect(dim.className).toContain("pointer-events-none");

    rerender(ui(false));
    expect(dim).toHaveAttribute("aria-busy", "false");
    expect(dim.className).not.toContain("opacity-50");
  });
});
