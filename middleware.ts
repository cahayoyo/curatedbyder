import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as any;
    const { pathname } = req.nextUrl;

    // /admin/login is public
    if (pathname === "/admin/login") return;

    // Buyers / dashboard: any authenticated user
    if (pathname.startsWith("/dashboard")) {
      if (!token) return NextResponse.redirect(new URL("/login", req.url));
      return;
    }

    // Admin panel: everything under /admin requires SUPER_ADMIN
    if (pathname.startsWith("/admin")) {
      if (!token || token.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
      return;
    }
  },
  {
    callbacks: { authorized: () => true },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};