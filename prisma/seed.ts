import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const raw = process.env.ADMIN_SEED;
  if (!raw) {
    console.error("ADMIN_SEED not set in .env (format: email|password|name; separate multiple with ;)");
    process.exit(1);
  }

  const entries = raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [email, password, name] = s.split("|").map((x) => (x ?? "").trim());
      return { email, password, name: name || "Admin" };
    })
    .filter((a) => a.email && a.password);

  if (entries.length === 0) {
    console.error("ADMIN_SEED has no valid entries");
    process.exit(1);
  }

  for (const a of entries) {
    const passwordHash = await bcrypt.hash(a.password, 10);
    const existing = await db.user.findUnique({ where: { email: a.email } });
    if (existing) {
      await db.user.update({
        where: { email: a.email },
        data: { passwordHash, name: a.name, role: "SUPER_ADMIN" },
      });
      console.log(`updated admin: ${a.email}`);
    } else {
      await db.user.create({
        data: { email: a.email, passwordHash, name: a.name, role: "SUPER_ADMIN" },
      });
      console.log(`created admin: ${a.email}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());