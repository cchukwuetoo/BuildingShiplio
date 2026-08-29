-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('EMAIL_VERIFICATION', 'SHIPMENT_DRIVER');

-- CreateEnum
CREATE TYPE "OtpStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Otp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shipmentId" TEXT,
    "code" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "status" "OtpStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Otp_shipmentId_key" ON "Otp"("shipmentId");

-- CreateIndex
CREATE INDEX "Otp_userId_purpose_idx" ON "Otp"("userId", "purpose");

-- AddForeignKey
ALTER TABLE "Otp" ADD CONSTRAINT "Otp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Otp" ADD CONSTRAINT "Otp_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
