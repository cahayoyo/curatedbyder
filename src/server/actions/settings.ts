"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { emitLog } from "@/instrumentation";
import { parseInput, type ActionResult } from "@/lib/actionResult";
import { MAX_ID, MAX_MONEY, MAX_RATE } from "@/lib/limits";

const SETTINGS_ID = "singleton";

const settingsSchema = z.object({
  fixedCost: z.number().int().min(0).max(MAX_MONEY),
  serviceFee: z.number().int().min(0).max(MAX_MONEY),
  myrToIdr: z.number().int().min(1).max(MAX_RATE),
  shippingPerKg: z.number().int().min(0).max(MAX_MONEY),
});

export async function updateStoreSettings(
  input: z.infer<typeof settingsSchema>
): Promise<ActionResult> {
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";
  const parsed = parseInput(settingsSchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;

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
  id: z.string().min(1).max(MAX_ID),
  show: z.boolean(),
});

export async function setBookDashboardVisibility(input: {
  id: string;
  show: boolean;
}): Promise<ActionResult> {
  await requireAdmin();
  const parsed = parseInput(visibilitySchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;

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
  const parsed = parseInput(visibilitySchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;

  await db.toy.update({ where: { id: data.id }, data: { showOnDashboard: data.show } });

  revalidatePath("/dashboard");
  revalidatePath("/admin/settings");
  return { ok: true };
}
