ALTER TYPE "ShipmentStatus" ADD VALUE 'PICKUP_ASSIGNED';
ALTER TYPE "ShipmentStatus" ADD VALUE 'PICKED_UP';
ALTER TYPE "ShipmentStatus" ADD VALUE 'RECEIVED_AT_WAREHOUSE';
ALTER TYPE "ShipmentStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "ShipmentStatus" ADD VALUE 'READY_FOR_DISPATCH';

ALTER TABLE "Shipment"
  ADD COLUMN "assignedDriverId" TEXT,
  ADD COLUMN "warehouseId" TEXT,
  ADD COLUMN "assignedAt" TIMESTAMP(3),
  ADD COLUMN "pickedUpAt" TIMESTAMP(3),
  ADD COLUMN "receivedAt" TIMESTAMP(3),
  ADD COLUMN "processingStartedAt" TIMESTAMP(3),
  ADD COLUMN "readyForDispatchAt" TIMESTAMP(3);

CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");
CREATE INDEX "Shipment_assignedDriverId_status_idx" ON "Shipment"("assignedDriverId", "status");
CREATE INDEX "Shipment_warehouseId_status_idx" ON "Shipment"("warehouseId", "status");

ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_assignedDriverId_fkey"
  FOREIGN KEY ("assignedDriverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_warehouseId_fkey"
  FOREIGN KEY ("warehouseId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;