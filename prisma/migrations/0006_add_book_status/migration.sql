-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('READY_STOCK', 'PRE_ORDER');

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "status" "StockStatus" NOT NULL DEFAULT 'READY_STOCK';