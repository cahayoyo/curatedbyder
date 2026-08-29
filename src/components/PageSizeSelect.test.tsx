import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PageSizeSelect } from "./PageSizeSelect";

const nav = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: nav.push,
    replace: nav.replace,
    refresh: nav.refresh,
  }),
  useSearchParams: () => nav.searchParams,
}));

beforeEach(() => {
  vi.clearAllMocks();
  nav.searchParams = new URLSearchParams();
});

describe("PageSizeSelect", () => {
  // Runs first on purpose: the component strips ?per= from the URL only once
  // per module load (didHandleInitialPer), and this file owns that first pass.
  it("strips a ?per= bookmark from the URL once on mount", () => {
    nav.searchParams = new URLSearchParams("per=30&q=a&page=2");
    render(<PageSizeSelect basePath="/items" />);
    expect(nav.replace).toHaveBeenCalledWith("/items?q=a&page=2");
  });

  it("shows the default size when per is absent or invalid, then builds ?per= on change", async () => {
    const user = userEvent.setup();
    nav.searchParams = new URLSearchParams("q=a&page=2");
    render(<PageSizeSelect basePath="/items" />);

    const trigger = screen.getByRole("combobox", { name: "Jumlah item per halaman" });
    expect(trigger).toHaveTextContent("20");

    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: "30" }));

    expect(nav.replace).toHaveBeenCalledWith("/items?q=a&per=30");
  });

  it("falls back to the default size for out-of-range per values", () => {
    nav.searchParams = new URLSearchParams("per=25");
    render(<PageSizeSelect basePath="/items" />);
    expect(
      screen.getByRole("combobox", { name: "Jumlah item per halaman" })
    ).toHaveTextContent("20");
  });
});
