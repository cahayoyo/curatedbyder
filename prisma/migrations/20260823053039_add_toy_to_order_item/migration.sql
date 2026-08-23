-- DropForeignKey
ALTER TABLE "public"."OrderItem" DROP CONSTRAINT "OrderItem_bookId_fkey";

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "toyId" TEXT,
ALTER COLUMN "bookId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_toyId_fkey" FOREIGN KEY ("toyId") REFERENCES "Toy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
