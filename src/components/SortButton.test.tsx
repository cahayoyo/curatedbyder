import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SortButton } from "./SortButton";

const nav = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push, replace: vi.fn(), refresh: vi.fn() }),
}));

function renderSort(overrides: Partial<Parameters<typeof SortButton>[0]> = {}) {
  return render(
    <SortButton
      label="Judul"
      column="title"
      basePath="/admin/books"
      query={{ q: "x", sort: "title", dir: "desc", page: "3" }}
      {...overrides}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SortButton", () => {
  it("sorts ascending on first click, preserving other params", async () => {
    const user = userEvent.setup();
    renderSort({ currentSort: undefined, currentDir: undefined });
    await user.click(screen.getByRole("button", { name: "Judul" }));
    expect(nav.push).toHaveBeenCalledWith("/admin/books?q=x&sort=title&dir=asc");
  });

  it("toggles to descending on second click", async () => {
    const user = userEvent.setup();
    renderSort({ column: "title", currentSort: "title", currentDir: "asc" });
    await user.click(screen.getByRole("button", { name: "Judul" }));
    expect(nav.push).toHaveBeenCalledWith("/admin/books?q=x&sort=title&dir=desc");
  });

  it("clears sort on third click", async () => {
    const user = userEvent.setup();
    renderSort({ column: "title", currentSort: "title", currentDir: "desc" });
    await user.click(screen.getByRole("button", { name: "Judul" }));
    expect(nav.push).toHaveBeenCalledWith("/admin/books?q=x");
  });
});
