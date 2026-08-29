import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionResult } from "@/lib/actionResult";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { SuccessModalProvider } from "./SuccessModal";

const nav = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: nav.push,
    replace: nav.replace,
    refresh: nav.refresh,
    prefetch: vi.fn(),
  }),
}));

const toast = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock("sonner", () => ({ toast }));

function renderCDB(onConfirm: () => Promise<void | ActionResult> | void) {
  return render(
    <SuccessModalProvider>
      <ConfirmDeleteButton
        title="Hapus buku?"
        description="Tindakan ini permanen."
        triggerLabel="Buka dialog"
        onConfirm={onConfirm}
      />
    </SuccessModalProvider>
  );
}

async function openAndConfirm(onConfirm: () => Promise<void | ActionResult> | void) {
  const user = userEvent.setup();
  renderCDB(onConfirm);
  await user.click(screen.getByRole("button", { name: "Buka dialog" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Hapus" }));
  return user;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ConfirmDeleteButton", () => {
  it("shows success modal, closes dialog, refreshes on success", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    await openAndConfirm(onConfirm);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Berhasil dihapus")).toBeInTheDocument();
    expect(nav.refresh).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows error toast and keeps dialog open on ActionResult failure", async () => {
    const onConfirm = vi.fn().mockResolvedValue({ ok: false, error: "Stok habis" });
    await openAndConfirm(onConfirm);

    expect(toast.error).toHaveBeenCalledWith("Stok habis");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByText("Berhasil dihapus")).not.toBeInTheDocument();
    expect(nav.refresh).not.toHaveBeenCalled();
  });

  it("shows the Error message on rejection", async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error("boom"));
    await openAndConfirm(onConfirm);

    expect(toast.error).toHaveBeenCalledWith("boom");
    expect(nav.refresh).not.toHaveBeenCalled();
  });

  it("shows the fallback message on non-Error rejection", async () => {
    const onConfirm = vi.fn().mockRejectedValue("nope");
    await openAndConfirm(onConfirm);

    expect(toast.error).toHaveBeenCalledWith("Gagal menghapus");
  });

  it("closes the dialog via the Batal button", async () => {
    const user = userEvent.setup();
    renderCDB(vi.fn());
    await user.click(screen.getByRole("button", { name: "Buka dialog" }));
    await user.click(screen.getByRole("button", { name: "Batal" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(nav.refresh).not.toHaveBeenCalled();
  });
});
