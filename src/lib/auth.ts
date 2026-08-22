import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        mode: { label: "Mode", type: "text" },
        username: { label: "Username", type: "text" },
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
          if (!user) throw new Error("Email salah");
          if (user.role !== "SUPER_ADMIN") throw new Error("Email salah");
          const ok = await bcrypt.compare(credentials.password, user.passwordHash ?? "");
          if (!ok) throw new Error("Kata sandi salah");
          return { id: user.id, email: user.email, name: user.name, role: user.role };
        }

        // Buyer: username only (auto-generated: firstName + last 4 digits of phone)
        if (credentials?.mode === "buyer") {
          const username = (credentials.username || "").trim().toLowerCase();
          if (!username) return null;

          const user = await db.user.findFirst({ where: { username, role: "USER" } });
          if (!user) throw new Error("Username not found");

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