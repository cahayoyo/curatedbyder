import { db } from "@/lib/db";

export type StoreSettings = {
  fixedCost: number;
  serviceFee: number;
  myrToIdr: number;
  shippingPerKg: number;
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  fixedCost: 5 * 4400,
  serviceFee: 15000,
  myrToIdr: 4200,
  shippingPerKg: 25000,
};

const SETTINGS_ID = "singleton";

export async function getStoreSettings(): Promise<StoreSettings> {
  const row = await db.storeSetting.findUnique({
    where: { id: SETTINGS_ID },
    select: { fixedCost: true, serviceFee: true, myrToIdr: true, shippingPerKg: true },
  });
  return row ?? DEFAULT_STORE_SETTINGS;
}
