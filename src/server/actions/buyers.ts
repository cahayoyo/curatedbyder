"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { emitLog } from "@/instrumentation";
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
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";

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

  let buyer: User;
  try {
    buyer = await db.user.create({
      data: {
        name: data.name,
        username: generateUsername(data.name, data.phone),
        phone: data.phone,
        contact: data.contact,
        role: "USER",
      },
    });
  } catch (e) {
    emitLog(`Buyer "${data.name}" save failed`, { actor, name: data.name, error: String(e) }, SeverityNumber.ERROR);
    throw e;
  }

  revalidatePath("/admin/buyers");
  revalidatePath("/admin/orders");
  emitLog(`Buyer "${buyer.name}" created`, { actor, buyer_id: buyer.id, name: buyer.name });
  return { ok: true, data: buyer };
}

export async function updateBuyer(
  id: string,
  input: z.infer<typeof buyerSchema>
): Promise<ActionResultWithData<User>> {
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";

  const data = buyerSchema.parse(input);
  const username = generateUsername(data.name, data.phone);
  const [existingByPhone, existingByUsername] = await Promise.all([
    db.user.findFirst({ where: { phone: data.phone, NOT: { id } } }),
    db.user.findFirst({ where: { username, NOT: { id } } }),
  ]);
  if (existingByPhone) return { ok: false, error: "Nomor telepon sudah dipakai pembeli lain" };
  if (existingByUsername)
    return { ok: false, error: "Username sudah dipakai, ubah nama atau nomor telepon" };

  let buyer: User;
  try {
    buyer = await db.user.update({
      where: { id },
      data: { name: data.name, username, phone: data.phone, contact: data.contact },
    });
  } catch (e) {
    emitLog(`Buyer "${data.name}" update failed`, { actor, buyer_id: id, name: data.name, error: String(e) }, SeverityNumber.ERROR);
    throw e;
  }

  revalidatePath("/admin/buyers");
  revalidatePath("/admin/orders");
  emitLog(`Buyer "${buyer.name}" updated`, { actor, buyer_id: buyer.id, name: buyer.name });
  return { ok: true, data: buyer };
}

export async function deleteBuyer(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";

  const buyer = await db.user.findUnique({ where: { id }, select: { name: true } });
  const sold = await db.order.count({ where: { buyerId: id } });
  if (sold > 0) {
    return {
      ok: false,
      error: `${buyer?.name ?? "Pembeli"} sudah pernah transaksi dan tidak bisa dihapus`,
    };
  }

  try {
    await db.user.delete({ where: { id } });
  } catch (e) {
    emitLog(`Buyer "${buyer?.name ?? id}" delete failed`, { actor, buyer_id: id, error: String(e) }, SeverityNumber.ERROR);
    throw e;
  }
  revalidatePath("/admin/buyers");
  revalidatePath("/admin/orders");
  emitLog(`Buyer "${buyer?.name ?? id}" deleted`, { actor, buyer_id: id });
  return { ok: true };
}