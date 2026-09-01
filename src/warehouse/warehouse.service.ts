import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ShipmentStatus } from '../shipments/enums/shipment-status.enum';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  findQueue(warehouseId: string) {
    return this.prisma.shipment.findMany({
      where: {
        OR: [
          { status: ShipmentStatus.PICKED_UP, warehouseId: null },
          { warehouseId, status: { in: [ShipmentStatus.RECEIVED_AT_WAREHOUSE, ShipmentStatus.PROCESSING] } },
        ],
      },
      orderBy: { pickedUpAt: 'asc' },
    });
  }

  async receive(warehouseId: string, shipmentId: string) {
    return this.transition(warehouseId, shipmentId, ShipmentStatus.PICKED_UP, {
      warehouseId,
      receivedAt: new Date(),
      status: ShipmentStatus.RECEIVED_AT_WAREHOUSE,
    });
  }

  async startProcessing(warehouseId: string, shipmentId: string) {
    return this.transition(warehouseId, shipmentId, ShipmentStatus.RECEIVED_AT_WAREHOUSE, {
      processingStartedAt: new Date(),
      status: ShipmentStatus.PROCESSING,
    });
  }

  async markReady(warehouseId: string, shipmentId: string) {
    return this.transition(warehouseId, shipmentId, ShipmentStatus.PROCESSING, {
      readyForDispatchAt: new Date(),
      status: ShipmentStatus.READY_FOR_DISPATCH,
    });
  }

  private async transition(warehouseId: string, shipmentId: string, currentStatus: ShipmentStatus, data: any) {
    const result = await this.prisma.shipment.updateMany({
      where: {
        id: shipmentId,
        status: currentStatus,
        ...(currentStatus === ShipmentStatus.PICKED_UP ? { warehouseId: null } : { warehouseId }),
      },
      data,
    });

    if (result.count === 0) {
      throw new ConflictException('Shipment is not available for this warehouse action');
    }

    return this.prisma.shipment.findUnique({ where: { id: shipmentId } });
  }
}