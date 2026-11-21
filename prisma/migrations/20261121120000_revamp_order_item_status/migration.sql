-- Revamp order item status to four values and allow quantity 0.
-- Legacy stage timestamp columns are intentionally preserved.

-- 1. Map legacy statuses before replacing the enum.
UPDATE "OrderItem"
SET "status" = 'ORDER_PLACED'
WHERE "status" = 'SHIPPING_TO_INDONESIA';

UPDATE "OrderItem"
SET "status" = 'ARRIVED_AT_WAREHOUSE'
WHERE "status" = 'ARRIVED_IN_INDONESIA';

UPDATE "OrderItem"
SET "status" = 'SHIPPED_TO_CUSTOMER'
WHERE "status" = 'ORDER_DELIVERED';

-- 2. Normalize timestamps into the stages that remain visible.
--    Legacy columns are preserved.
UPDATE "OrderItem"
SET "arrivedAtWarehouseAt" = COALESCE("arrivedAtWarehouseAt", "arrivedInIndonesiaAt")
WHERE "arrivedInIndonesiaAt" IS NOT NULL;

UPDATE "OrderItem"
SET "shippedToCustomerAt" = COALESCE("shippedToCustomerAt", "deliveredAt")
WHERE "deliveredAt" IS NOT NULL;

-- 3. Replace the enum.
ALTER TABLE "OrderItem" ALTER COLUMN "status" DROP DEFAULT;

CREATE TYPE "OrderStatus_new" AS ENUM (
  'ORDER_PLACED',
  'ARRIVED_AT_WAREHOUSE',
  'SHIPPED_TO_CUSTOMER',
  'OUT_OF_STOCK'
);

ALTER TABLE "OrderItem"
ALTER COLUMN "status" TYPE "OrderStatus_new"
USING ("status"::text::"OrderStatus_new");

DROP TYPE "OrderStatus";

ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";

ALTER TABLE "OrderItem" ALTER COLUMN "status" SET DEFAULT 'ORDER_PLACED';
