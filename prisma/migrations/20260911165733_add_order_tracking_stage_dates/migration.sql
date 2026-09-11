-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "arrivedAtWarehouseAt" TIMESTAMP(3),
ADD COLUMN     "arrivedInIndonesiaAt" TIMESTAMP(3),
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "placedAt" TIMESTAMP(3),
ADD COLUMN     "shippedToCustomerAt" TIMESTAMP(3),
ADD COLUMN     "shippingToIndonesiaAt" TIMESTAMP(3);

-- Backfill: existing items keep their first-stage date from the order date
UPDATE "OrderItem"
SET "placedAt" = "Order"."soldAt"
FROM "Order"
WHERE "OrderItem"."orderId" = "Order"."id";
