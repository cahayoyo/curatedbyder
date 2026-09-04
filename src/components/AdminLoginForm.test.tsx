import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminLoginForm } from "./AdminLoginForm";
import AdminLoginPage from "@/app/admin/login/page";

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

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: "Masuk" }));
}

describe("AdminLoginForm", () => {
  it("renders the redesigned layout", () => {
    render(<AdminLoginForm />);
    expect(screen.getByText("Admin Login")).toBeTruthy();
    expect(screen.getByText(/Masuk untuk mengakses dashboard administrator/)).toBeTruthy();
    expect(screen.getByPlaceholderText("Masukkan password")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Kunjungi Website Dashboard User/ })).toBeTruthy();
  });

  it("signs in with admin mode and redirects to /admin", async () => {
    render(<AdminLoginForm />);
    await fillAndSubmit("admin@mail.com", "rahasia");
    expect(auth.signIn).toHaveBeenCalledWith("credentials", {
      redirect: false,
      mode: "admin",
      email: "admin@mail.com",
      password: "rahasia",
    });
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/admin"));
    expect(nav.refresh).toHaveBeenCalled();
  });

  it("highlights the wrong email and password fields on error", async () => {
    auth.signIn.mockResolvedValue({ error: "Email salah! Password salah!" });
    render(<AdminLoginForm />);
    await fillAndSubmit("salah@mail.com", "salah");
    expect(await screen.findByText("Email salah!")).toBeTruthy();
    expect(screen.getByText("Password salah!")).toBeTruthy();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<AdminLoginForm />);
    const pw = screen.getByLabelText("Password") as HTMLInputElement;
    expect(pw.getAttribute("type")).toBe("password");
    await user.click(screen.getByRole("button", { name: /Tampilkan password/ }));
    expect(pw.getAttribute("type")).toBe("text");
  });
});

describe("AdminLoginPage", () => {
  it("renders logo, tagline, heading and footer", () => {
    render(<AdminLoginPage />);
    expect(screen.getByText(/CuratedByDer/)).toBeTruthy();
    expect(screen.getByText(/Books · Stories · To You/i)).toBeTruthy();
    expect(screen.getByText("Admin Login")).toBeTruthy();
    expect(screen.getByText(/All rights reserved/)).toBeTruthy();
  });
});
