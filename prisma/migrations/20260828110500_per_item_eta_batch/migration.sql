/*
  Warnings:

  - You are about to drop the columns `batchId` and `eta` on the `Order` table. Data existing in these columns is moved to OrderItem first (values inherited per item).

*/
-- 1. Add new columns (nullable first)
ALTER TABLE "OrderItem" ADD COLUMN     "batchId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN     "eta" "Eta";

-- 2. Backfill: item mewarisi batch & eta invoice-nya
UPDATE "OrderItem" SET "batchId" = o."batchId", "eta" = o."eta" FROM "Order" o WHERE o."id" = "OrderItem"."orderId";

-- 3. Enforce required + FK + index
ALTER TABLE "OrderItem" ALTER COLUMN "batchId" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "eta" SET NOT NULL;
CREATE INDEX "OrderItem_batchId_idx" ON "OrderItem"("batchId");
CREATE INDEX "OrderItem_eta_idx" ON "OrderItem"("eta");
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. Drop old columns on Order
ALTER TABLE "Order" DROP CONSTRAINT "Order_batchId_fkey";
DROP INDEX IF EXISTS "Order_batchId_idx";
ALTER TABLE "Order" DROP COLUMN "batchId";
ALTER TABLE "Order" DROP COLUMN "eta";
