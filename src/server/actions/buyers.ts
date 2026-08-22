"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { generateUsername } from "@/lib/username";

const buyerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6).regex(/^\d+$/, "Nomor telepon hanya boleh angka"),
  contact: z.string().optional().nullable(),
});

export async function createBuyer(input: z.infer<typeof buyerSchema>) {
  await requireAdmin();

  const data = buyerSchema.parse(input);
  const [existingByPhone, existingByUsername] = await Promise.all([
    db.user.findUnique({ where: { phone: data.phone } }),
    (async () => {
      const username = generateUsername(data.name, data.phone);
      return db.user.findUnique({ where: { username } });
    })(),
  ]);
  if (existingByPhone) throw new Error("A buyer with this phone already exists");
  if (existingByUsername) throw new Error("Username sudah dipakai, ubah nama atau nomor telepon");

  const buyer = await db.user.create({
    data: {
      name: data.name,
      username: generateUsername(data.name, data.phone),
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
  await requireAdmin();

  const data = buyerSchema.parse(input);
  const username = generateUsername(data.name, data.phone);
  const [existingByPhone, existingByUsername] = await Promise.all([
    db.user.findFirst({ where: { phone: data.phone, NOT: { id } } }),
    db.user.findFirst({ where: { username, NOT: { id } } }),
  ]);
  if (existingByPhone) throw new Error("A buyer with this phone already exists");
  if (existingByUsername) throw new Error("Username sudah dipakai, ubah nama atau nomor telepon");

  const buyer = await db.user.update({
    where: { id },
    data: { name: data.name, username, phone: data.phone, contact: data.contact },
  });

  revalidatePath("/admin/buyers");
  revalidatePath("/admin/orders");
  return buyer;
}

export async function deleteBuyer(id: string) {
  await requireAdmin();

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