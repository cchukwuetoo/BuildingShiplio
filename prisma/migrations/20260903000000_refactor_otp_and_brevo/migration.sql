-- 1. Remove shipmentId FK + column first (no unique constraint exists; it's a plain FK)
ALTER TABLE "Otp" DROP CONSTRAINT "Otp_shipmentId_fkey";
ALTER TABLE "Otp" DROP COLUMN "shipmentId";

-- 2. Remove updatedAt column
ALTER TABLE "Otp" DROP COLUMN "updatedAt";

-- 3. Handle OtpPurpose enum transformation
--    Create new enum type with new values
CREATE TYPE "OtpPurpose_new" AS ENUM ('REGISTRATION', 'PASSWORD_RESET', 'SHIPMENT_PICKUP', 'WAREHOUSE_HANDOFF');
--    Add temp column, map old values to new
ALTER TABLE "Otp" ADD COLUMN "purpose_new" "OtpPurpose_new";
UPDATE "Otp" SET "purpose_new" = CASE
  WHEN "purpose" = 'EMAIL_VERIFICATION' THEN 'REGISTRATION'::"OtpPurpose_new"
  WHEN "purpose" = 'SHIPMENT_DRIVER' THEN 'SHIPMENT_PICKUP'::"OtpPurpose_new"
  ELSE 'REGISTRATION'::"OtpPurpose_new"
END;
ALTER TABLE "Otp" DROP COLUMN "purpose";
ALTER TABLE "Otp" RENAME COLUMN "purpose_new" TO "purpose";
ALTER TABLE "Otp" ALTER COLUMN "purpose" SET NOT NULL;
--    Drop old enum type and rename new one
DROP TYPE "OtpPurpose";
ALTER TYPE "OtpPurpose_new" RENAME TO "OtpPurpose";

-- 4. Handle OtpStatus enum: add isUsed boolean, drop status column and OtpStatus type
ALTER TABLE "Otp" ADD COLUMN "isUsed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Otp" DROP COLUMN "status";
DROP TYPE "OtpStatus";

-- 5. Make userId nullable + set ON DELETE SET NULL
ALTER TABLE "Otp" DROP CONSTRAINT "Otp_userId_fkey";
ALTER TABLE "Otp" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Otp" ADD CONSTRAINT "Otp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 6. Add referenceId column + index
ALTER TABLE "Otp" ADD COLUMN "referenceId" TEXT;
CREATE INDEX "Otp_referenceId_idx" ON "Otp"("referenceId");

-- 7. Change User.isActive default to false
ALTER TABLE "User" ALTER COLUMN "isActive" SET DEFAULT false;