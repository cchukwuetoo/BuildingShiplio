import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ShipmentStatus } from '../shipments/enums/shipment-status.enum';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  findAvailableAndAssigned(driverId: string) {
    return this.prisma.shipment.findMany({
      where: {
        OR: [
          { status: ShipmentStatus.PENDING, assignedDriverId: null },
          { assignedDriverId: driverId, status: { in: [ShipmentStatus.PICKUP_ASSIGNED] } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async accept(driverId: string, shipmentId: string) {
    const result = await this.prisma.shipment.updateMany({
      where: { id: shipmentId, status: ShipmentStatus.PENDING, assignedDriverId: null },
      data: {
        assignedDriverId: driverId,
        assignedAt: new Date(),
        status: ShipmentStatus.PICKUP_ASSIGNED,
      },
    });

    if (result.count === 0) {
      throw new ConflictException('Shipment is no longer available');
    }

    return this.prisma.shipment.findUnique({ where: { id: shipmentId } });
  }

  async markPickedUp(driverId: string, shipmentId: string) {
    const result = await this.prisma.shipment.updateMany({
      where: { id: shipmentId, assignedDriverId: driverId, status: ShipmentStatus.PICKUP_ASSIGNED },
      data: { pickedUpAt: new Date(), status: ShipmentStatus.PICKED_UP },
    });

    if (result.count === 0) {
      throw new ConflictException('Shipment is not assigned to this driver');
    }

    return this.prisma.shipment.findUnique({ where: { id: shipmentId } });
  }
}