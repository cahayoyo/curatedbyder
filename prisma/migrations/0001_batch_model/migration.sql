-- Rename old enum type so table name "Batch" is free
ALTER TYPE "Batch" RENAME TO "BatchEnum";

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Batch_name_key" ON "Batch"("name");

-- Seed default batches
INSERT INTO "Batch" ("id", "name") VALUES
    ('batch1', 'BATCH1'),
    ('batch2', 'BATCH2')
ON CONFLICT ("name") DO NOTHING;

-- Add batchId column (nullable first to backfill)
ALTER TABLE "Order" ADD COLUMN "batchId" TEXT;

-- Backfill orders using their old enum batch value
UPDATE "Order" o
SET "batchId" = b."id"
FROM "Batch" b
WHERE b."name" = o."batch"::text;

-- Drop old enum column and renamed type
ALTER TABLE "Order" DROP COLUMN IF EXISTS "batch";
DROP TYPE IF EXISTS "BatchEnum";

-- Set NOT NULL and FK
ALTER TABLE "Order" ALTER COLUMN "batchId" SET NOT NULL;
ALTER TABLE "Order" ADD CONSTRAINT "Order_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;