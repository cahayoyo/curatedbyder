import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { db } from "./db";
import { emitLog } from "@/instrumentation";

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
        // Admin: email + password (SUPER_ADMIN only)
        if (credentials?.mode === "admin") {
          if (!credentials.email || !credentials.password) return null;
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });
          if (!user || user.role !== "SUPER_ADMIN") {
            emitLog(`Admin "${credentials.email}" login failed`, { actor: credentials.email, login_mode: "admin", reason: "email_not_found" }, SeverityNumber.WARN);
            throw new Error("Email salah");
          }
          const ok = await bcrypt.compare(credentials.password, user.passwordHash ?? "");
          const adminName = user.name ?? user.email ?? credentials.email;
          if (!ok) {
            emitLog(`Admin "${adminName}" login failed`, { actor: credentials.email, login_mode: "admin", reason: "wrong_password" }, SeverityNumber.WARN);
            throw new Error("Kata sandi salah");
          }
          emitLog(`Admin "${adminName}" login succeeded`, { actor: user.email ?? user.id, login_mode: "admin" });
          return { id: user.id, email: user.email, name: user.name, role: user.role };
        }

        // Buyer: username + phone (auto-generated: firstName + last 4 digits of phone)
        if (credentials?.mode === "buyer") {
          const username = (credentials.username || "").trim().toLowerCase();
          const phoneInput = (credentials.phone || "").replace(/\D/g, "");
          if (!username || !phoneInput) return null;

          const user = await db.user.findFirst({ where: { username, role: "USER" } });
          if (!user) {
            emitLog(`Buyer "${username}" login failed`, { actor: username, login_mode: "buyer", reason: "username_not_found" }, SeverityNumber.WARN);
            throw new Error("USERNAME_NOT_FOUND");
          }

          const storedPhone = (user.phone || "").replace(/\D/g, "");
          const buyerName = user.name ?? username;
          if (!storedPhone || storedPhone !== phoneInput) {
            emitLog(`Buyer "${buyerName}" login failed`, { actor: username, login_mode: "buyer", reason: "phone_mismatch" }, SeverityNumber.WARN);
            throw new Error("PHONE_MISMATCH");
          }

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