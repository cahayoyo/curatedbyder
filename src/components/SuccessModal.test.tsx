import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SuccessModalProvider, useSuccessModal } from "./SuccessModal";

function Trigger() {
  const { success } = useSuccessModal();
  return (
    <button type="button" onClick={() => success("Order saved")}>
      trigger
    </button>
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
});
