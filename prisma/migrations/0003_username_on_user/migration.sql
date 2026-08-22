-- Add username for buyers (auto-generated: firstName + last 4 digits of phone)
ALTER TABLE "User" ADD COLUMN "username" TEXT;

UPDATE "User"
SET "username" = LOWER(SPLIT_PART(TRIM("name"), ' ', 1)) || RIGHT(TRIM("phone"), 4)
WHERE "role" = 'USER';

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");