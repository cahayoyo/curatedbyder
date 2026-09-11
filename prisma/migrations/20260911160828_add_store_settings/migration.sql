-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "showOnDashboard" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Toy" ADD COLUMN     "showOnDashboard" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "StoreSetting" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "fixedCost" INTEGER NOT NULL,
    "serviceFee" INTEGER NOT NULL,
    "myrToIdr" INTEGER NOT NULL,
    "shippingPerKg" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSetting_pkey" PRIMARY KEY ("id")
);
