import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { prerender } from "react-dom/static";

async function toHtml(el: React.ReactElement) {
  const { prelude } = await prerender(el);
  let out = "";
  const reader = prelude.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out += new TextDecoder().decode(value);
  }
  return out;
}

const mockSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockSession(...args),
}));

vi.mock("next-auth/react", () => ({ signIn: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: () => <img alt="" />,
}));

vi.mock("@/assets/img/logoderbaru.jpeg", () => ({ default: "logo.jpeg" }));
vi.mock("@/components/UserNav", () => ({ UserNav: () => <div>usernav</div> }));
vi.mock("@/components/AdminNav", () => ({ AdminNav: () => <div>adminnav</div> }));
vi.mock("@/components/UserMenu", () => ({
  UserMenu: ({ name }: { name?: string }) => <div>{name ?? "anon"}</div>,
}));
vi.mock("@/components/HomeLogin", () => ({ HomeLogin: () => <div>homelogin</div> }));
vi.mock("@/components/PhotoCarousel", () => ({ PhotoCarousel: () => <div>carousel</div> }));
vi.mock("@/components/BookAccents", () => ({ BookAccents: () => <div>accents</div> }));

import Home, { SessionRedirect } from "@/app/page";
import LoginPage, { RedirectIfAuthed } from "@/app/login/page";
import DashboardLayout from "@/app/dashboard/layout";
import AdminLayout from "@/app/admin/(panel)/layout";

async function expectRedirect(promise: Promise<unknown>, url: string) {
  await expect(promise).rejects.toThrow(`NEXT_REDIRECT:${url}`);
}

describe("root page", () => {
  beforeEach(() => mockSession.mockReset());

  it("renders an empty shell", () => {
    expect(renderToStaticMarkup(<Home />)).toBe("");
  });

  it("redirects to /dashboard when session exists", async () => {
    mockSession.mockResolvedValue({ user: { role: "USER" } });
    await expectRedirect(SessionRedirect(), "/dashboard");
  });

  it("redirects to /login without session", async () => {
    mockSession.mockResolvedValue(null);
    await expectRedirect(SessionRedirect(), "/login");
  });
});

describe("login page", () => {
  beforeEach(() => mockSession.mockReset());

  it("renders the login shell", async () => {
    const html = await toHtml(<LoginPage />);
    expect(html).toContain("CuratedByDer");
    expect(html).toContain("homelogin");
  });

  it("redirects to /dashboard when session exists", async () => {
    mockSession.mockResolvedValue({ user: { role: "USER" } });
    await expectRedirect(RedirectIfAuthed(), "/dashboard");
  });

  it("renders nothing without session", async () => {
    mockSession.mockResolvedValue(null);
    await expect(await RedirectIfAuthed()).toBe(null);
  });
});

describe("dashboard layout", () => {
  beforeEach(() => mockSession.mockReset());

  it("renders header shell and streams content for USER", async () => {
    mockSession.mockResolvedValue({ user: { role: "USER", name: "Budi" } });
    const html = await toHtml(
      <DashboardLayout>
        <div>pagecontent</div>
      </DashboardLayout>
    );
    expect(html).toContain("USER DASHBOARD");
    expect(html).toContain("pagecontent");
  });
});

describe("admin layout", () => {
  beforeEach(() => mockSession.mockReset());

  it("renders header shell and streams content for SUPER_ADMIN", async () => {
    mockSession.mockResolvedValue({ user: { role: "SUPER_ADMIN", name: "Adera" } });
    const html = await toHtml(
      <AdminLayout>
        <div>pagecontent</div>
      </AdminLayout>
    );
    expect(html).toContain("ADMIN DASHBOARD");
    expect(html).toContain("pagecontent");
  });
});
