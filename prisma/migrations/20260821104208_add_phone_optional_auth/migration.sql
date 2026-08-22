-- AlterTable: add phone, make email and passwordHash optional for buyers
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");