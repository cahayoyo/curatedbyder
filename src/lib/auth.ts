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
        name: { label: "Name", type: "text" },
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
          if (!user) throw new Error("Email salah");
          if (user.role !== "SUPER_ADMIN") throw new Error("Email salah");
          const ok = await bcrypt.compare(credentials.password, user.passwordHash ?? "");
          if (!ok) throw new Error("Kata sandi salah");
          return { id: user.id, email: user.email, name: user.name, role: user.role };
        }

        // Buyer: name + phone (no password)
        if (credentials?.mode === "buyer") {
          const normalizedName = (credentials.name || "").trim();
          const normalizedPhone = (credentials.phone || "").trim();
          if (!normalizedName || !normalizedPhone) return null;

          const [nameUser, phoneUser] = await Promise.all([
            db.user.findFirst({ where: { name: normalizedName, role: "USER" } }),
            db.user.findFirst({ where: { phone: normalizedPhone, role: "USER" } }),
          ]);

          // Both are unknown → flag both
          if (!nameUser && !phoneUser) {
            throw new Error("Name not found; Phone not found");
          }
          if (!nameUser) throw new Error("Name not found");
          if (!phoneUser) throw new Error("Phone not found");

          // Both exist; require them to be the same person
          const user = nameUser.id === phoneUser.id ? nameUser : null;
          if (!user) throw new Error("Name and phone do not match");

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