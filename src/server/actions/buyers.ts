"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { generateUsername } from "@/lib/username";

function isAdmin(session: { user?: {
  id?: string;
  role?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
} } | null): boolean {
  return session?.user?.role === "SUPER_ADMIN";
}

const buyerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6).regex(/^\d+$/, "Nomor telepon hanya boleh angka"),
  contact: z.string().optional().nullable(),
});

export async function createBuyer(input: z.infer<typeof buyerSchema>) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) throw new Error("Forbidden");

  const data = buyerSchema.parse(input);
  const existing = await db.user.findFirst({ where: { phone: data.phone } });
  if (existing) throw new Error("A buyer with this phone already exists");

  const username = generateUsername(data.name, data.phone);
  const usernameExist = await db.user.findFirst({ where: { username } });
  if (usernameExist) throw new Error("Username sudah dipakai, ubah nama atau nomor telepon");

  const buyer = await db.user.create({
    data: {
      name: data.name,
      username,
      phone: data.phone,
      contact: data.contact,
      role: "USER",
    },
  });

  revalidatePath("/admin/buyers");
  revalidatePath("/admin/orders");
  return buyer;
}

export async function updateBuyer(id: string, input: z.infer<typeof buyerSchema>) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) throw new Error("Forbidden");

  const data = buyerSchema.parse(input);
  const existing = await db.user.findFirst({
    where: { phone: data.phone, NOT: { id } },
  });
  if (existing) throw new Error("A buyer with this phone already exists");

  const username = generateUsername(data.name, data.phone);
  const usernameExist = await db.user.findFirst({
    where: { username, NOT: { id } },
  });
  if (usernameExist) throw new Error("Username sudah dipakai, ubah nama atau nomor telepon");

  const buyer = await db.user.update({
    where: { id },
    data: { name: data.name, username, phone: data.phone, contact: data.contact },
  });

  revalidatePath("/admin/buyers");
  revalidatePath("/admin/orders");
  return buyer;
}

export async function deleteBuyer(id: string) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) throw new Error("Forbidden");

  const sold = await db.order.count({ where: { buyerId: id } });
  if (sold > 0) {
    const buyer = await db.user.findUnique({ where: { id } });
    throw new Error(
      `${buyer?.name ?? "Pembeli"} sudah pernah transaksi dan tidak bisa dihapus`
    );
  }

  await db.user.delete({ where: { id } });
  revalidatePath("/admin/buyers");
  revalidatePath("/admin/orders");
}