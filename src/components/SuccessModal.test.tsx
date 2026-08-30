import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SuccessModalProvider, useSuccessModal } from "./SuccessModal";

function Trigger() {
  const { success, error } = useSuccessModal();
  return (
    <>
      <button type="button" onClick={() => success("Order saved")}>
        trigger
      </button>
      <button type="button" onClick={() => error("Buku ini sudah pernah terjual dan tidak bisa dihapus.")}>
        error-trigger
      </button>
    </>
  );
}

function renderModal() {
  return render(
    <SuccessModalProvider>
      <Trigger />
    </SuccessModalProvider>
  );
}

function openModal() {
  fireEvent.click(screen.getByRole("button", { name: "trigger" }));
  expect(screen.getByRole("status")).toBeInTheDocument();
}

function openErrorModal() {
  fireEvent.click(screen.getByRole("button", { name: "error-trigger" }));
  expect(screen.getByRole("alert")).toBeInTheDocument();
}

afterEach(() => {
  vi.useRealTimers();
});

describe("SuccessModal", () => {
  it("shows the message when success() is called", () => {
    renderModal();
    openModal();
    expect(screen.getByText("Order saved")).toBeInTheDocument();
  });

  it("closes via the X button", async () => {
    const user = userEvent.setup();
    renderModal();
    openModal();
    await user.click(screen.getByRole("button", { name: "Tutup" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("closes on overlay click", () => {
    renderModal();
    openModal();
    fireEvent.click(screen.getByRole("status"));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("closes on Escape keydown", () => {
    renderModal();
    openModal();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("auto-dismisses after 2 seconds", () => {
    vi.useFakeTimers();
    renderModal();
    openModal();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("does not auto-dismiss before 2 seconds", () => {
    vi.useFakeTimers();
    renderModal();
    openModal();
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("progress bar depletes after double requestAnimationFrame", () => {
    vi.useFakeTimers();
    const { container } = renderModal();
    openModal();
    const bar = container.querySelector<HTMLElement>(".h-full.bg-green-600");
    expect(bar).not.toBeNull();
    expect(bar).toHaveStyle({ width: "100%" });
    act(() => {
      vi.advanceTimersToNextFrame();
      vi.advanceTimersToNextFrame();
    });
    expect(bar).toHaveStyle({ width: "0%" });
    expect(bar?.style.transition).toBe("width 2000ms linear");
  });

  it("shows the message with alert role when error() is called", () => {
    renderModal();
    openErrorModal();
    expect(screen.getByText("Buku ini sudah pernah terjual dan tidak bisa dihapus.")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("error modal uses a red progress bar", () => {
    vi.useFakeTimers();
    const { container } = renderModal();
    openErrorModal();
    const bar = container.querySelector<HTMLElement>(".h-full.bg-red-600");
    expect(bar).not.toBeNull();
    expect(bar).toHaveStyle({ width: "100%" });
    act(() => {
      vi.advanceTimersToNextFrame();
      vi.advanceTimersToNextFrame();
    });
    expect(bar).toHaveStyle({ width: "0%" });
  });

  it("resets the variant when switching from error to success", () => {
    const { container } = renderModal();
    openErrorModal();
    fireEvent.click(screen.getByRole("button", { name: "trigger" }));
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(container.querySelector(".h-full.bg-red-600")).toBeNull();
    expect(container.querySelector(".h-full.bg-green-600")).not.toBeNull();
  });
});
