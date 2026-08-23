-- CreateTable
CREATE TABLE "Toy" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publisher" TEXT,
    "info" TEXT,
    "image" TEXT,
    "price" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "status" "StockStatus" NOT NULL DEFAULT 'READY_STOCK',
    "formats" "Format"[] DEFAULT ARRAY[]::"Format"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Toy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToyBatchPrice" (
    "id" TEXT NOT NULL,
    "toyId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "formats" "Format"[] DEFAULT ARRAY[]::"Format"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToyBatchPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Toy_title_key" ON "Toy"("title");

-- CreateIndex
CREATE INDEX "ToyBatchPrice_batchId_idx" ON "ToyBatchPrice"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "ToyBatchPrice_toyId_batchId_key" ON "ToyBatchPrice"("toyId", "batchId");

-- AddForeignKey
ALTER TABLE "ToyBatchPrice" ADD CONSTRAINT "ToyBatchPrice_toyId_fkey" FOREIGN KEY ("toyId") REFERENCES "Toy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToyBatchPrice" ADD CONSTRAINT "ToyBatchPrice_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
