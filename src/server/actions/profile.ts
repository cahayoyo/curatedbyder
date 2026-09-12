"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { emitLog } from "@/instrumentation";
import type { ActionResult } from "@/lib/actionResult";

const addressSchema = z.string().trim().max(500, "Alamat maksimal 500 karakter");

export async function updateMyAddress(input: {
  contact: string | null;
}): Promise<ActionResult> {
  const session = await requireRole("USER");
  const id = session.user.id;
  if (!id) return { ok: false, error: "Sesi tidak valid, silakan masuk ulang" };

  const parsed = addressSchema.safeParse(input.contact ?? "");
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Alamat tidak valid" };
  }
  const contact = parsed.data.length > 0 ? parsed.data : null;

  try {
    await db.user.update({ where: { id }, data: { contact } });
  } catch (e) {
    emitLog(
      "Buyer address update failed",
      { actor: id, buyer_id: id, error: String(e) },
      SeverityNumber.ERROR,
    );
    throw e;
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/admin/buyers");
  revalidatePath("/admin/orders");
  emitLog("Buyer address updated", { actor: id, buyer_id: id });
  return { ok: true };
}
