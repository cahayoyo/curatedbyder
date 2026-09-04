import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mockSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockSession(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

vi.mock("@/components/UserMenu", () => ({
  UserMenu: ({ name }: { name?: string }) => <div data-testid="user-menu">{name ?? "anon"}</div>,
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

import { HeaderMenus, RoleGate } from "@/components/session-gate";
import { NavMenuFallback } from "@/components/NavMenuFallback";
import { AppHeader } from "@/components/AppHeader";

async function expectRedirect(promise: Promise<unknown>, url: string) {
  await expect(promise).rejects.toThrow(`NEXT_REDIRECT:${url}`);
}

describe("RoleGate", () => {
  it("renders children when role matches", async () => {
    mockSession.mockResolvedValue({ user: { role: "USER", name: "Budi" } });
    const el = await RoleGate({ role: "USER", children: <div id="child" /> });
    expect(renderToStaticMarkup(el as React.ReactElement)).toContain('id="child"');
  });

  it("redirects no session to /login for USER", async () => {
    mockSession.mockResolvedValue(null);
    await expectRedirect(RoleGate({ role: "USER", children: null }), "/login");
  });

  it("redirects SUPER_ADMIN to /admin when gating USER", async () => {
    mockSession.mockResolvedValue({ user: { role: "SUPER_ADMIN" } });
    await expectRedirect(RoleGate({ role: "USER", children: null }), "/admin");
  });

  it("redirects USER to /dashboard when gating SUPER_ADMIN", async () => {
    mockSession.mockResolvedValue({ user: { role: "USER" } });
    await expectRedirect(RoleGate({ role: "SUPER_ADMIN", children: null }), "/dashboard");
  });

  it("redirects no session to /admin/login for SUPER_ADMIN", async () => {
    mockSession.mockResolvedValue(null);
    await expectRedirect(RoleGate({ role: "SUPER_ADMIN", children: null }), "/admin/login");
  });
});

describe("HeaderMenus", () => {
  it("renders user menu with session name for matching role", async () => {
    mockSession.mockResolvedValue({ user: { role: "USER", name: "Budi" } });
    const el = await HeaderMenus({ role: "USER" });
    expect(renderToStaticMarkup(el as React.ReactElement)).toContain("Budi");
  });

  it("redirects matching the gate rules", async () => {
    mockSession.mockResolvedValue({ user: { role: "SUPER_ADMIN" } });
    await expectRedirect(HeaderMenus({ role: "USER" }), "/admin");
    mockSession.mockResolvedValue(null);
    await expectRedirect(HeaderMenus({ role: "SUPER_ADMIN" }), "/admin/login");
  });
});

describe("shell pieces", () => {
  beforeEach(() => mockSession.mockReset());

  it("NavMenuFallback renders the menu button", () => {
    expect(renderToStaticMarkup(<NavMenuFallback />)).toContain("Menu");
  });

  it("AppHeader renders badge and slots", () => {
    const html = renderToStaticMarkup(
      <AppHeader
        badge="TEST BADGE"
        mobileNav={<div>mob</div>}
        desktopNav={<div>desk</div>}
        menus={<div>menus</div>}
      />
    );
    expect(html).toContain("TEST BADGE");
    expect(html).toContain("mob");
    expect(html).toContain("desk");
    expect(html).toContain("menus");
  });
});
