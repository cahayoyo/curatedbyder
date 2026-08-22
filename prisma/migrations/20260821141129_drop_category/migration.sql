-- DropForeignKey
ALTER TABLE "Book" DROP CONSTRAINT "Book_categoryId_fkey";

-- DropIndex
DROP INDEX "Category_name_key";

-- DropForeignKey
ALTER TABLE "Book" DROP COLUMN "categoryId";

-- DropTable
DROP TABLE "Category";