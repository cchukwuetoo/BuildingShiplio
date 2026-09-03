-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'DRIVER', 'WAREHOUSE', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('DRAFT', 'PENDING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "pickupCity" TEXT NOT NULL,
    "pickupState" TEXT NOT NULL,
    "pickupContactName" TEXT NOT NULL,
    "pickupPhone" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "deliveryCity" TEXT NOT NULL,
    "deliveryState" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "packageType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedWeight" DOUBLE PRECISION NOT NULL,
    "weightUnit" TEXT NOT NULL,
    "length" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "dimensionUnit" TEXT,
    "isFragile" BOOLEAN NOT NULL,
    "declaredValue" DOUBLE PRECISION,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
