-- CreateTable
CREATE TABLE "BookBatchPrice" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookBatchPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookBatchPrice_batchId_idx" ON "BookBatchPrice"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "BookBatchPrice_bookId_batchId_key" ON "BookBatchPrice"("bookId", "batchId");

-- AddForeignKey
ALTER TABLE "BookBatchPrice" ADD CONSTRAINT "BookBatchPrice_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookBatchPrice" ADD CONSTRAINT "BookBatchPrice_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
