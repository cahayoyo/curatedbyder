import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchInput } from "./SearchInput";

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

afterEach(() => {
  vi.useRealTimers();
});

describe("SearchInput", () => {
  it("debounces typing into ?q= and drops the page param", () => {
    vi.useFakeTimers();
    nav.searchParams = new URLSearchParams("q=abc&page=4&f=1");
    render(<SearchInput basePath="/items" placeholder="Cari" />);

    fireEvent.change(screen.getByPlaceholderText("Cari"), {
      target: { value: "har" },
    });
    vi.advanceTimersByTime(349);
    expect(nav.replace).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(nav.replace).toHaveBeenCalledWith("/items?q=har&f=1");
  });

  it("resets the debounce timer on every keystroke", () => {
    vi.useFakeTimers();
    render(<SearchInput basePath="/items" placeholder="Cari" />);

    fireEvent.change(screen.getByPlaceholderText("Cari"), { target: { value: "ha" } });
    vi.advanceTimersByTime(200);
    fireEvent.change(screen.getByPlaceholderText("Cari"), { target: { value: "har" } });
    vi.advanceTimersByTime(200);
    expect(nav.replace).not.toHaveBeenCalled();
    vi.advanceTimersByTime(150);
    expect(nav.replace).toHaveBeenCalledTimes(1);
    expect(nav.replace).toHaveBeenCalledWith("/items?q=har");
  });

  it("deletes the param when the value is emptied", () => {
    vi.useFakeTimers();
    nav.searchParams = new URLSearchParams("q=abc&page=4&f=1");
    render(<SearchInput basePath="/items" placeholder="Cari" />);

    fireEvent.change(screen.getByPlaceholderText("Cari"), { target: { value: "" } });
    vi.advanceTimersByTime(350);
    expect(nav.replace).toHaveBeenCalledWith("/items?f=1");
  });

  it("uses a custom paramKey", () => {
    vi.useFakeTimers();
    render(<SearchInput basePath="/items" placeholder="Cari" paramKey="bookQ" />);

    fireEvent.change(screen.getByPlaceholderText("Cari"), { target: { value: "zz" } });
    vi.advanceTimersByTime(350);
    expect(nav.replace).toHaveBeenCalledWith("/items?bookQ=zz");
  });

  it("clear button removes the param immediately and empties the input", () => {
    nav.searchParams = new URLSearchParams("q=abc&page=4&f=1");
    render(<SearchInput basePath="/items" placeholder="Cari" />);

    const clear = screen.getByRole("button", { name: "Clear search" });
    fireEvent.click(clear);
    expect(nav.replace).toHaveBeenCalledWith("/items?f=1");
    expect(screen.getByPlaceholderText("Cari")).toHaveValue("");
  });

  it("syncs the input when the URL param changes externally", () => {
    const view = render(<SearchInput basePath="/items" placeholder="Cari" />);
    nav.searchParams = new URLSearchParams("q=xyz");
    view.rerender(<SearchInput basePath="/items" placeholder="Cari" />);
    expect(screen.getByPlaceholderText("Cari")).toHaveValue("xyz");
  });

  it("canceling pending debounce on unmount never navigates", () => {
    vi.useFakeTimers();
    const { unmount } = render(<SearchInput basePath="/items" placeholder="Cari" />);

    fireEvent.change(screen.getByPlaceholderText("Cari"), { target: { value: "zz" } });
    unmount();
    vi.advanceTimersByTime(500);
    expect(nav.replace).not.toHaveBeenCalled();
  });
});
