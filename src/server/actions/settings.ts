"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { emitLog } from "@/instrumentation";
import type { ActionResult } from "@/lib/actionResult";

const SETTINGS_ID = "singleton";

const settingsSchema = z.object({
  fixedCost: z.number().int().min(0),
  serviceFee: z.number().int().min(0),
  myrToIdr: z.number().int().min(1),
  shippingPerKg: z.number().int().min(0),
});

export async function updateStoreSettings(
  input: z.infer<typeof settingsSchema>
): Promise<ActionResult> {
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";
  const data = settingsSchema.parse(input);

  await db.storeSetting.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...data },
    update: data,
  });

  revalidatePath("/login");
  revalidatePath("/dashboard");
  revalidatePath("/admin/settings");
  emitLog("Store settings updated", { actor, ...data });
  return { ok: true };
}

const visibilitySchema = z.object({
  id: z.string().min(1),
  show: z.boolean(),
});

export async function setBookDashboardVisibility(input: {
  id: string;
  show: boolean;
}): Promise<ActionResult> {
  await requireAdmin();
  const data = visibilitySchema.parse(input);

  await db.book.update({ where: { id: data.id }, data: { showOnDashboard: data.show } });

  revalidatePath("/dashboard");
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function setToyDashboardVisibility(input: {
  id: string;
  show: boolean;
}): Promise<ActionResult> {
  await requireAdmin();
  const data = visibilitySchema.parse(input);

  await db.toy.update({ where: { id: data.id }, data: { showOnDashboard: data.show } });

  revalidatePath("/dashboard");
  revalidatePath("/admin/settings");
  return { ok: true };
}
