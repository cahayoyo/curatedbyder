/*
  Warnings:

  - You are about to drop the column `status` on the `Order` table. Data existing in the column will be lost. Data already lives on OrderItem.status (backfilled by previous migration).

*/
-- DropIndex
DROP INDEX "Order_status_idx";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "status";
