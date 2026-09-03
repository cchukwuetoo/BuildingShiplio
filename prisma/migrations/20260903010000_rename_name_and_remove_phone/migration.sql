-- 1. Add fullName column
ALTER TABLE "User" ADD COLUMN "fullName" TEXT;

-- 2. Backfill fullName from firstName + lastName
UPDATE "User" SET "fullName" = COALESCE(NULLIF(TRIM("firstName" || ' ' || "lastName"), ''), 'Unknown');

-- 3. Make fullName NOT NULL and replace the phone unique index with email-unique (phone index dropped)
ALTER TABLE "User" ALTER COLUMN "fullName" SET NOT NULL;

-- 4. Drop unique constraint on phone (accompanying index)
DROP INDEX "User_phone_key";

-- 5. Drop firstName / lastName / phone columns
ALTER TABLE "User" DROP COLUMN "firstName";
ALTER TABLE "User" DROP COLUMN "lastName";
ALTER TABLE "User" DROP COLUMN "phone";