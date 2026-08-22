import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "";
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || !password) {
    console.error("ADMIN_EMAIL / ADMIN_PASSWORD not set in .env");
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 10);

  await db.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Owner", passwordHash, role: "SUPER_ADMIN" },
  });

  console.log("Seeded admin:", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());