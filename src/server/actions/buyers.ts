"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { generateUsername } from "@/lib/username";
import type { User } from "@prisma/client";
import { ActionResult, ActionResultWithData } from "@/lib/actionResult";

const buyerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6).regex(/^\d+$/, "Nomor telepon hanya boleh angka"),
  contact: z.string().optional().nullable(),
});

export async function createBuyer(
  input: z.infer<typeof buyerSchema>
): Promise<ActionResultWithData<User>> {
  await requireAdmin();

  const data = buyerSchema.parse(input);
  const [existingByPhone, existingByUsername] = await Promise.all([
    db.user.findUnique({ where: { phone: data.phone } }),
    (async () => {
      const username = generateUsername(data.name, data.phone);
      return db.user.findUnique({ where: { username } });
    })(),
  ]);
  if (existingByPhone) return { ok: false, error: "Nomor telepon sudah dipakai pembeli lain" };
  if (existingByUsername)
    return { ok: false, error: "Username sudah dipakai, ubah nama atau nomor telepon" };

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
  return { ok: true, data: buyer };
}

export async function updateBuyer(
  id: string,
  input: z.infer<typeof buyerSchema>
): Promise<ActionResultWithData<User>> {
  await requireAdmin();

  const data = buyerSchema.parse(input);
  const username = generateUsername(data.name, data.phone);
  const [existingByPhone, existingByUsername] = await Promise.all([
    db.user.findFirst({ where: { phone: data.phone, NOT: { id } } }),
    db.user.findFirst({ where: { username, NOT: { id } } }),
  ]);
  if (existingByPhone) return { ok: false, error: "Nomor telepon sudah dipakai pembeli lain" };
  if (existingByUsername)
    return { ok: false, error: "Username sudah dipakai, ubah nama atau nomor telepon" };

  const buyer = await db.user.update({
    where: { id },
    data: { name: data.name, username, phone: data.phone, contact: data.contact },
  });

  revalidatePath("/admin/buyers");
  revalidatePath("/admin/orders");
  return { ok: true, data: buyer };
}

export async function deleteBuyer(id: string): Promise<ActionResult> {
  await requireAdmin();

  const sold = await db.order.count({ where: { buyerId: id } });
  if (sold > 0) {
    const buyer = await db.user.findUnique({ where: { id } });
    return {
      ok: false,
      error: `${buyer?.name ?? "Pembeli"} sudah pernah transaksi dan tidak bisa dihapus`,
    };
  }

  await db.user.delete({ where: { id } });
  revalidatePath("/admin/buyers");
  revalidatePath("/admin/orders");
  return { ok: true };
}