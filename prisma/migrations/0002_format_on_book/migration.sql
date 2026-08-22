-- AlterTable: add formats array to Book
ALTER TABLE "Book" ADD COLUMN "formats" "Format"[] NOT NULL DEFAULT '{}';

-- AlterTable: drop format from Order
ALTER TABLE "Order" DROP COLUMN IF EXISTS "format";