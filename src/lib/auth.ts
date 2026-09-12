import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { db } from "./db";
import { emitLog } from "@/instrumentation";

// Compared against when the account is missing so the admin path always pays
// the same bcrypt cost (avoids a timing signal / user enumeration).
const DUMMY_HASH = "$2b$10$5RZZ8efkdtyundG7kMhD0O4K6ex0MadIpluxxoi5ypwMkcOq8.m9y";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        mode: { label: "Mode", type: "text" },
        username: { label: "Username", type: "text" },
        phone: { label: "Phone", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Admin: email + password (SUPER_ADMIN only). Errors are intentionally
        // generic so the response never reveals whether the email exists.
        if (credentials?.mode === "admin") {
          if (!credentials.email || !credentials.password) return null;
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });
          const ok = await bcrypt.compare(
            credentials.password,
            user?.passwordHash ?? DUMMY_HASH
          );
          if (!user || user.role !== "SUPER_ADMIN" || !ok) {
            const reason = !user
              ? "email_not_found"
              : user.role !== "SUPER_ADMIN"
                ? "not_admin"
                : "wrong_password";
            emitLog(`Admin login failed`, { actor: credentials.email, login_mode: "admin", reason }, SeverityNumber.WARN);
            throw new Error("Email atau kata sandi salah");
          }
          const adminName = user.name ?? user.email ?? credentials.email;
          emitLog(`Admin "${adminName}" login succeeded`, { actor: user.email ?? user.id, login_mode: "admin" });
          return { id: user.id, email: user.email, name: user.name, role: user.role };
        }

        // Buyer: username + phone (auto-generated: firstName + last 4 digits of phone).
        // Errors are intentionally generic so the response never reveals whether
        // the username exists.
        if (credentials?.mode === "buyer") {
          const username = (credentials.username || "").trim().toLowerCase();
          const phoneInput = (credentials.phone || "").replace(/\D/g, "");
          if (!username || !phoneInput) return null;

          const user = await db.user.findFirst({ where: { username, role: "USER" } });
          const storedPhone = (user?.phone || "").replace(/\D/g, "");
          if (!user || !storedPhone || storedPhone !== phoneInput) {
            const reason = !user
              ? "username_not_found"
              : !storedPhone
                ? "no_phone_on_record"
                : "phone_mismatch";
            emitLog(`Buyer "${username}" login failed`, { actor: username, login_mode: "buyer", reason }, SeverityNumber.WARN);
            throw new Error("Username atau nomor telepon salah");
          }

          const buyerName = user.name ?? username;
          emitLog(`Buyer "${buyerName}" login succeeded`, { actor: username, buyer_id: user.id, login_mode: "buyer" });
          return { id: user.id, email: user.email, name: user.name, role: user.role };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.sub ?? "";
      if (session.user) session.user.role = token.role ?? "USER";
      return session;
    },
  },
};