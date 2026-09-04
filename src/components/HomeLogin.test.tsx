import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomeLogin } from "./HomeLogin";

const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
const auth = vi.hoisted(() => ({ signIn: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push, replace: vi.fn(), refresh: nav.refresh }),
}));

vi.mock("next-auth/react", () => ({
  signIn: auth.signIn,
}));

beforeEach(() => {
  vi.clearAllMocks();
  auth.signIn.mockResolvedValue({});
});

async function fillAndSubmit(username: string, phone: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Username"), username);
  await user.type(screen.getByLabelText("Nomor Telepon"), phone);
  await user.click(screen.getByRole("button", { name: /Masuk & Lihat Pesanan/ }));
}

describe("HomeLogin", () => {
  it("renders the redesigned form", () => {
    render(<HomeLogin />);
    expect(screen.getByLabelText("Username")).toBeTruthy();
    expect(screen.getByLabelText("Nomor Telepon")).toBeTruthy();
    expect(screen.getByText(/Masukkan username yang sudah pernah diberikan oleh admin/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Hubungi Admin" })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: /Instagram|Shopee/ }).length).toBe(2);
  });

  it("signs in with buyer mode and redirects to /dashboard", async () => {
    render(<HomeLogin />);
    await fillAndSubmit("curatedbyder123", "08128312345");
    expect(auth.signIn).toHaveBeenCalledWith("credentials", {
      redirect: false,
      mode: "buyer",
      username: "curatedbyder123",
      phone: "08128312345",
    });
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/dashboard"));
    expect(nav.refresh).toHaveBeenCalled();
  });

  it("highlights unknown username", async () => {
    auth.signIn.mockResolvedValue({ error: "USERNAME_NOT_FOUND" });
    render(<HomeLogin />);
    await fillAndSubmit("salah", "08128312345");
    expect(await screen.findByText("Username tidak ditemukan!")).toBeTruthy();
  });

  it("highlights mismatched phone", async () => {
    auth.signIn.mockResolvedValue({ error: "PHONE_MISMATCH" });
    render(<HomeLogin />);
    await fillAndSubmit("curatedbyder123", "000");
    expect(await screen.findByText("Nomor telepon tidak cocok!")).toBeTruthy();
  });
});
