-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'ORDER_PLACED';

-- Backfill: item lama mewarisi status invoice-nya
UPDATE "OrderItem" SET "status" = o."status" FROM "Order" o WHERE o."id" = "OrderItem"."orderId";
